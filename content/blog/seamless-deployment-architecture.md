---
author: "Lakshay Kalbhor"
date: 2018-04-12
linktitle: Designing a seamless deployment architecture
title: Designing a seamless deployment architecture
weight: 10
---

## Preface

Previously the deployment process at Avanti was largely adhoc, with no streamlined simple *“touch of a button”* system.

New code was usually deployed in such a manner :

* Tell load balancer to take down Server A, deploy new code on Server A (Server B handles all traffic).

* Tell load balancer to take down Server B(while getting Server A up again) and deploy new code on Server B.

There were obvious downsides to such a process, for one it required us to limit deployments to only low traffic periods (usually late at night) and required a lot of manual interference with the load balancer & servers.

So, we decided to build a seamless deployment system that would achieve the following things:

* Should trigger deployments with a simple *“push of a button”*

* Should cause minimum downtime

* Should be truly seamless (Absolutely no manual interference)

![](https://cdn-images-1.medium.com/max/5398/1*4D7rMz4h7nvF5-nDZTLa_w.jpeg)
