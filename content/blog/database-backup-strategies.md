---
author: "Lakshay Kalbhor"
date: 2018-04-19
linktitle: Database backup strategies
title: Database backup strategies
weight: 10
---

Recently I started interning at Avanti Learning Centres, an Indian startup focussing on providing interesting ways of learning.

One of my first tasks as an intern was to automate the backing up of their databases. I had to look at the problem broadly and list out the standard ways of taking database backups, and then choose a method that would work best.

Avanti uses mongodb and redis for their database & caching requirements. Both services run on separate EC2 instances (All MongoDB databases are on 1 instance and all Redis related stuff is on 1 instance).

So, for this problem we do not have to consider sharded or distributed clusters of databases.

*phew*

### When it comes to backing up data, there are 3 strategies (speaking broadly) :

1. Backing up an entire volume using Linux’s LVM functionality (Offered as EBS Snapshots by AWS)

2. Using a database specific tool such as mongodump , sql-dump

3. Using something simple such as cp or rsync

### The key requirements from the back up strategy at Avanti were:

1. Should be simple to automate and perform frequently

2. Shouldn’t cause any downtime

3. Shouldn’t be very memory intensive

4. Should be easy to restore

Through these key considerations, option 3 was out. It was tough to automate, and would cause down time since cp & rsync are not atomic operations.

Now, to choose between option #1 and #2, it is important to understand how each works.

### EBS Snapshots

EBS snapshots work by saving backups incrementally. 
When an EBS snapshot is created, only the data on the EBS volume that has changed since the last EBS snapshot is stored in the new EBS snapshot.

When an EBS snapshot is used to restore data, all data from that EBS snapshot can be restored as well as the data from the previous snapshots. In this way, the snapshot is a full backup.

![](https://cdn-images-1.medium.com/max/2000/1*sOSrz9nP0L7gedHNIh5PcQ.png)

Snapshots can also be deleted (to save space & reduce storage costs). AWS chains together and moves the missing data ahead accordingly. Hence, at any point of time irrespective of the number of deletions, EBS snapshots can recover the entire volume.

Writes on the filesystem should be suspended while a snapshot is taken. For this, MongoDB has an interesting solution in the form of journaling. Understanding how Mongo handles suspending writes without any downtime is out of the scope of this blog post. But here’s a [nice explanation](https://www.mongodb.com/blog/post/how-mongodbs-journaling-works).

### Mongodump

Mongodump is a CLI tool that dumps the corresponding database in BSON format (Binary JSON). This data dump can then be stored wherever required (Upload to S3, etc).

A few problems with this approach include :

1. **Point of propogation & flow**. This command runs on the instance we’re backing up. The dump is first stored on the same file system and then a transfer to S3 is initiated. In this process, the backup lives on the instance for too long. (We don’t want that)

2. Lots of points of failures. mongodump could fail, the part where it dumps to the disk could fail, the scheduled upload to S3 could fail.

3. No way to take incremental backups (at least no solution that is industry backed)

![](https://cdn-images-1.medium.com/max/2000/1*E4EC8meEOAlemH-LtdHqMA.jpeg)

It was pretty clear that option #1 made the most sense, since it fulfilled pretty much all the requirements.

## The Final Implementation

After deciding that EBS Snapshots was the way to go, it was time to write a script that automatically took snapshots. I used aws cli(a command-line tool provided by aws) and a simple shell script that took snapshots of specific instances and purged snapshots older than 7 days.

The script followed the following steps :

* Determine the instance ID of the EC2 servers (By checking Scheduled-Snapshots tag)

* Gather a list of all volume IDs attached to that instance

* Take a snapshot of each attached volume

* The script will then delete all associated snapshots taken by the script that are older than 7 days

This script coupled in a cron job made sure that it ran at specific intervals of time. It is important that this script ran somewhere seperate from the actual database servers; we decided that the reverse proxy server suited this purporse.

## The Consequence

**Avanti now has timely backups of their databases!**
Another side effect of this new backup process was that it made it easier to sync staging and production database environments.

![](https://cdn-images-1.medium.com/max/3576/1*U6yPjLuLl0eoEzNqZ8bgzg.png)

The process of restoring a volume from one of these snapshots is as simple as a few clicks.
