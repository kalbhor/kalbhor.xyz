---
author: "Lakshay Kalbhor"
date: 2022-06-05
linktitle: Limit access to shared pool of objects in Go
title: Limit access to shared pool of objects in Go
weight: 10
---

Recently at work we were posed with a simple problem to maintain a fixed number of concurrent connections to an external API across many goroutines.

To implement this, a colleague and I ideated over a few solutions : 

- **Using `sync.Pool`** : Load the pool initially with the max connections, and pass this pool around. The issue with this was, we needed a blocking solution. `sync.Pool` returns `nil` if there aren't any objects in the pool (if `new()` isn't specified). This meant that callers would have to implement some retry mechanism based on the value returned by pool.

- **Using a buffered channel** : By setting the capacity of a buffered channel to max connections, all go routines could listen for available connections and return them to the channel when done. This way, the go routines would wait if no connection were available. This was a simple and intuitive solution and should be employed in most cases.

My colleague found the `golang.org/x/sync/semaphore` package, which has a weighted semaphore with `Acquire()` and `Release()` methods.
Upon benchmarking, we found that this was slightly faster than using a buffered channel.
