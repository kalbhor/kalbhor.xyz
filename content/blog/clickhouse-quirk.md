---
author: "Lakshay Kalbhor"
date: 2022-07-10
linktitle: Differences in postgres & clickhouse Go driver
title: Differences in postgres & clickhouse Go driver
weight: 10
---

Recently at work I was tasked with refactoring a small Go app to write to clickhouse, instead of postgres. 
The migration was simple, but I encountered a case where Clickhouse's driver behaved differently. 

The difference was when trying to pass a struct into an insert statement. PG driver calls the struct's `Value() (driver.Value, error)` method before insertion (this way, we can do any transformations). The `Value()` method was being used to marshal the struct into json before inserting. I found that the CH driver did not call this method when using prepared statements. It was only called on executing a statement directly.

The example below tries to write to CH & PG dbs using both `tx.Exec` & `tx.Prepare`. It works fine for PG, and `Value()` is called for both. In CH `Value()` is only called for `tx.Exec` and it fails at `tx.Prepare`

The methods to create PG, CH connections have been redracted for brevity. 

```
package main

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"log"
	"time"

	_ "github.com/ClickHouse/clickhouse-go/v2"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type Info struct {
	Serial      int    `json:"serial"`
	Description string `json:"description"`
}

type SampleModel struct {
	Name      string `db:"name"`
	JsonModel Info   `db:"json_model"`
}

func (s Info) Value() (driver.Value, error) {
	log.Println("Calling Value()")

	b, _ := json.Marshal(s)

	return string(b), nil
}

var (
	chDB *sqlx.DB
	pgDB *sqlx.DB
)

func init() {
	var err error

	chDB, err = clickhouseDB("default", "default", "", "localhost", 9000, 10, 10, 10)
	if err != nil {
		log.Fatal(err)
	}

	pgDB, err = postgresDB("postgres", "postgres", "postgres", "localhost", 5432, 10, 10, 10)
	if err != nil {
		log.Fatal(err)
	}
}

func main() {
	sample := SampleModel{
		Name: "test",
		JsonModel: Info{
			Serial:      1,
			Description: "This is a sample description",
		},
	}
	log.Println("inserting into PG")
	insertModel(pgDB, sample)
	log.Println("inserted successfully into PG")

	log.Println("inserting into CH")
	insertModel(chDB, sample)
	log.Println("inserted successfully into CH")
}

func insertModel(db *sqlx.DB, model SampleModel) {
	tx, err := db.Beginx()
	if err != nil {
		log.Fatal("db err: ", err)
	}

	log.Println("inserting via tx.Exec()")
	if _, err := tx.Exec("INSERT INTO testing (name, json_model) VALUES ($1, $2)", model.Name, model.JsonModel); err != nil {
		log.Fatal("db err: ", err)
	}
	log.Println("done.")

	log.Println("inserting via tx.Prepare -> stmt.Exec()")
	stmt, err := tx.Prepare(`INSERT INTO testing (name, json_model) VALUES ($1,$2);`)
	if err != nil {
		log.Fatal("db err (prepare stmt): ", err)
	}

	if _, err := stmt.Exec(model.Name, model.JsonModel); err != nil {
		log.Fatal(err)
	}
	log.Println("done.")

	// Commit to db
	if err := tx.Commit(); err != nil {
		if err := tx.Rollback(); err != nil {
			log.Fatal("err (during rollback): ", err)
		}
		log.Fatal("err (rollback done): ", err)
	}
}
```


