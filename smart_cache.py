"""
smart_cache.py - Simplified tiered cache
Using redis-py instead of aioredis
"""

import asyncio
import json
import hashlib
import time
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import redis.asyncio as redis
import sqlite3
import logging

logger = logging.getLogger(__name__)

@dataclass
class CacheConfig:
    redis_url: str = "redis://localhost:6379/0"
    default_ttl: int = 3600
    max_memory_items: int = 10000

class SmartCache:
    """Tiered cache with Redis"""
    
    def __init__(self, config: CacheConfig):
        self.config = config
        self._redis = None
        self._cache = {}
        self.stats = {'hits': 0, 'misses': 0}
    
    async def _get_redis(self):
        if not self._redis:
            self._redis = await redis.from_url(
                self.config.redis_url,
                decode_responses=True
            )
        return self._redis
    
    def _generate_key(self, prefix, *args):
        key_str = f"{prefix}:{'|'.join(str(a) for a in args)}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    async def get_route(self, origin_lat, origin_lon, dest_lat, dest_lon):
        """Get cached route"""
        key = self._generate_key("route", round(origin_lat, 5), round(origin_lon, 5),
                                 round(dest_lat, 5), round(dest_lon, 5))
        
        # Memory cache
        if key in self._cache:
            self.stats['hits'] += 1
            return self._cache[key]
        
        # Redis
        try:
            redis_client = await self._get_redis()
            data = await redis_client.get(f"route:{key}")
            if data:
                self.stats['hits'] += 1
                self._cache[key] = json.loads(data)
                return self._cache[key]
        except:
            pass
        
        self.stats['misses'] += 1
        return None
    
    async def set_route(self, origin_lat, origin_lon, dest_lat, dest_lon, route_data):
        """Cache a route"""
        key = self._generate_key("route", round(origin_lat, 5), round(origin_lon, 5),
                                 round(dest_lat, 5), round(dest_lon, 5))
        
        # Memory
        self._cache[key] = route_data
        if len(self._cache) > 10000:
            # Simple cleanup
            keys = list(self._cache.keys())[:5000]
            for k in keys:
                del self._cache[k]
        
        # Redis
        try:
            redis_client = await self._get_redis()
            await redis_client.setex(
                f"route:{key}",
                self.config.default_ttl,
                json.dumps(route_data)
            )
        except:
            pass
        
        return True
    
    async def get_stats(self):
        total = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total * 100) if total > 0 else 0
        return {
            'hits': self.stats['hits'],
            'misses': self.stats['misses'],
            'hit_rate': f"{hit_rate:.2f}%",
            'memory_size': len(self._cache)
        }