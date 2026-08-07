#!/bin/bash
# Usage: ./add_poi.sh "slang" "Formal Name" "Area" lat lng "category"
python3 -c "
import sqlite3
db = sqlite3.connect('para_geo_knowledge.db')
db.execute('INSERT OR REPLACE INTO geo_knowledge VALUES (?,?,?,?,?,?)', 
    ('$1', '$2', '$3', $4, $5, '$6'))
db.commit()
print(f'✅ Added: $1 → $2')
db.close()
"
