```
docker-compose exec mongo bash
```

mongo pubchem --eval "var collection = 'substances'; var persistResults = true;" /tools/variety.js


db.substances.aggregate(
   [
	{ $sample: { size: 1000000 } },
	{ $out: "substancesSample"}
   ]
)

mongo pubchem --eval "var collection = 'substancesSample'; var persistResults = true;" /tools/variety.js


