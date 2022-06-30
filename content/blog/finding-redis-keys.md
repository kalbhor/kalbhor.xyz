---
author: "Lakshay Kalbhor"
date: 2022-06-30
linktitle: Finding redis keys using a Lua script
title: Finding redis keys using a Lua script
weight: 10
---

Recently I was in a situation where I needed to search redis for keys that matched a certain pattern. Using the `KEYS *` command was out of question, since it is highly discouraged as it blocks all operations while running. 

Redis also has a [`SCAN`](https://redis.io/commands/scan/) command which incrementally iterates over a collection. It also has an option to match a given glob-style pattern. This seemed to be the right command, but for my usecase, I wanted to only get hash's with the keys matching the pattern. `SCAN` has a `TYPE` option which returns only a certain type but is only available after redis version 6 (I was on a lower version).

So I decided to write a short lua script that would incrementally scan all keys, check for the pattern and type and return the matching keys.

```
local c = 0 
local resp = redis.call('SCAN',c,'MATCH','positions*', 'COUNT',100000)
local ans = {} 
c = tonumber(resp[1]) 
local dataList = resp[2] 

for i=1,#dataList do 
    local d = dataList[i] 
    local d_type = redis.call('TYPE',d) 
    if d_type.ok == 'hash' then 
        ans[#ans + 1] = d 
    end 
end 
return ans
```

To scan all the keys, it would be better to add a check for the returned cursor (```resp[1]```) and keep iterating, till it is returned 0 (all keys have been scanned). 
But for my purpose, I was able to do with simply setting a high enough count. 


I encountered an issue initially, when I assumed `redis.call('TYPE',d)` would simply return the type. 
```
local d_type = redis.call('TYPE',d) 
if d_type == 'hash' then 
    ans[#ans + 1] = d 
end 
```

I was confused on getting an error, but realised that `redis.call('TYPE',d)` actually returned a hashmap. To check the type, I had to use `d_type.ok`. This was explained [here](https://groups.google.com/g/redis-db/c/te0jnSr5tfY)