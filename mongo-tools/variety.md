```
docker-compose exec mongo bash
```

mongo pubchem --eval "var collection = 'substances'; var persistResults = true;" /tools/variety.js
