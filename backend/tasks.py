"""
tasks.py - Celery Task Definitions
Distributed async processing for NLP, Routing, and Geocoding
"""

from celery import Celery
from celery.result import AsyncResult
import asyncio
import json
import time
import logging
from typing import Dict, Optional

from graph_engine import RoutingEngine, build_transit_graph
from smart_cache import SmartCache, CacheConfig
from llm_engine import parse_chat_intent, normalize_location

logger = logging.getLogger(__name__)

# ============ CELERY APP ============
celery_app = Celery(
    'para_ph_tasks',
    broker='redis://localhost:6379/1',
    backend='redis://localhost:6379/2',
    include=['tasks']
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Manila',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=60,
    task_soft_time_limit=50,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# ============ GLOBAL STATE ============
_graph = None
_cache = None

def get_graph():
    """Lazy load graph"""
    global _graph
    if _graph is None:
        _graph = build_transit_graph("geojson_data/")
    return _graph

def get_cache():
    """Lazy load cache"""
    global _cache
    if _cache is None:
        config = CacheConfig(
            redis_url="redis://localhost:6379/0",
            default_ttl=3600,
            revalidation_interval=300
        )
        _cache = SmartCache(config)
    return _cache

# ============ TASKS ============

@celery_app.task(name='process_chat_task', bind=True)
def process_chat_task(self, user_id: str, message: str, task_id: str = None):
    """
    Process chat message - NLP + Routing
    """
    self.update_state(state='PROGRESS', meta={'progress': 0, 'stage': 'parsing'})
    
    try:
        # Step 1: Parse intent
        self.update_state(state='PROGRESS', meta={'progress': 30, 'stage': 'parsing'})
        intent = parse_chat_intent(message)
        
        if intent.get('intent') == 'info':
            return {
                'status': 'info',
                'reply': "I can help you find routes! Try: 'from UP Diliman to UST'"
            }
        
        if intent.get('intent') == 'unknown':
            return {
                'status': 'error',
                'reply': "I didn't understand. Try: 'from UPD to UST'"
            }
        
        origin_raw = intent.get('origin', '')
        dest_raw = intent.get('destination', '')
        
        if not origin_raw or not dest_raw:
            return {
                'status': 'error',
                'reply': "Please specify both origin and destination. Example: 'from UPD to UST'"
            }
        
        # Step 2: Geocode
        self.update_state(state='PROGRESS', meta={'progress': 60, 'stage': 'geocoding'})
        
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        origin_geo = loop.run_until_complete(asyncio.to_thread(normalize_location, origin_raw))
        dest_geo = loop.run_until_complete(asyncio.to_thread(normalize_location, dest_raw))
        
        if not origin_geo or not dest_geo:
            return {
                'status': 'error',
                'reply': f"Could not find one or both locations.\nOrigin: {origin_raw}\nDestination: {dest_raw}"
            }
        
        # Step 3: Route
        self.update_state(state='PROGRESS', meta={'progress': 80, 'stage': 'routing'})
        
        cache = get_cache()
        graph = get_graph()
        engine = RoutingEngine(graph, cache)
        
        route = loop.run_until_complete(
            engine.find_route(
                origin_geo['lat'], origin_geo['lon'],
                dest_geo['lat'], dest_geo['lon']
            )
        )
        
        loop.close()
        
        if not route:
            return {
                'status': 'error',
                'reply': f"Walang nakitang ruta from '{origin_raw}' to '{dest_raw}'. Please try different locations."
            }
        
        # Step 4: Format response
        self.update_state(state='PROGRESS', meta={'progress': 100, 'stage': 'complete'})
        
        return {
            'status': 'success',
            'reply': f"📍 {origin_raw} ➡️ {dest_raw}\n✅ {route['message']}",
            'route': route,
            'origin': origin_raw,
            'destination': dest_raw
        }
        
    except Exception as e:
        logger.error(f"Task failed: {e}")
        return {
            'status': 'error',
            'reply': f"Sorry, an error occurred: {str(e)}"
        }

@celery_app.task(name='process_route_task')
def process_route_task(route_request: Dict, task_id: str = None):
    """
    Process route calculation task
    """
    try:
        origin_lat = route_request['origin_lat']
        origin_lon = route_request['origin_lng']
        dest_lat = route_request['dest_lat']
        dest_lon = route_request['dest_lng']
        
        cache = get_cache()
        graph = get_graph()
        engine = RoutingEngine(graph, cache)
        
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        route = loop.run_until_complete(
            engine.find_route(origin_lat, origin_lon, dest_lat, dest_lon)
        )
        loop.close()
        
        return route
        
    except Exception as e:
        logger.error(f"Route task failed: {e}")
        return {'error': str(e)}

@celery_app.task(name='process_nlp_task')
def process_nlp_task(text: str):
    """
    Process NLP task
    """
    try:
        return parse_chat_intent(text)
    except Exception as e:
        return {'error': str(e)}

@celery_app.task(name='process_geocode_task')
def process_geocode_task(location: str):
    """
    Process geocoding task
    """
    try:
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(asyncio.to_thread(normalize_location, location))
        loop.close()
        return result
    except Exception as e:
        return {'error': str(e)}

@celery_app.task(name='invalidate_stale_routes')
def invalidate_stale_routes():
    """
    Background task to invalidate stale routes
    """
    try:
        cache = get_cache()
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(cache.start_revalidation_worker())
        loop.close()
        return {'status': 'success', 'message': 'Stale routes invalidated'}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}

# ============ CELERY BEAT SCHEDULE ============
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'invalidate-stale-routes': {
        'task': 'invalidate_stale_routes',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
}