"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
 
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "new job",
    salary: 125000,
    equity: 0,
    company_handle: 'c1'
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: newJob
    });
  });

  test("not ok for users that are not ADMIN", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          title: "new",
          equity: .2,
          company_handle: 'c1'
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "new job",
            salary: "125000",
            equity: 0,
            company_handle: 'c1'
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
        jobs:[
            {
                title: "new job 1",
                salary: 125000,
                equity: 0,
                company_handle: 'c1',
            },
            {
                title: "new job 2",
                salary: 175000,
                equity: 0.1,
                company_handle: 'c2'
            },
            {
                title: "new job 3",
                salary: 200000,
                equity: 0.2,
                company_handle: 'c1'
            }
        ]
    });
  });

  test("test filtered results based on title", async function () {
    const resp = await request(app)
        .get("/jobs?title=new")
    expect(resp.statusCode).toEqual(200);
    expect(resp.body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({"title":"new job 1"}),
        expect.objectContaining({"title":"new job 2"}),
        expect.objectContaining({"title":"new job 3"})
      ]))
  });

  test("test filtered results based on minSalary", async function () {
    const resp = await request(app)
        .get("/jobs?minSalary=150000")
    expect(resp.statusCode).toEqual(200);
    expect(resp.body.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({"company_handle": "c2"}),
      ]))
  });

  test("test expect failure based on minSalary", async function () {
    const resp = await request(app)
        .get("/jobs?minSalary='xyz'")
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/c1`)
    expect(resp.statusCode).toEqual(200)
    expect(resp.body).toEqual({
        jobs:[
            {
                id: +`${resp.body.jobs[0].id}`,
                title: "new job 1",
                salary: 125000,
                equity: 0,
                company_handle: 'c1',
            },
            {
                id: +`${resp.body.jobs[1].id}`,
                title: "new job 3",
                salary: 200000,
                equity: 0.2,
                company_handle: 'c1'
            }
        ]
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/jobs/c4`)
    expect(resp.statusCode).toEqual(200)
    expect(resp.body.jobs).toEqual([]);
  });
});

// /************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:handle", function () {
  test("works for ADMIN users", async function () {
      const resp = await request(app).get(`/jobs/c2`)
      const job = resp.body.jobs[0]
      const resp2 = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          title: "C1-new",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp2.body).toEqual({
      job : {
        id: +`${job.id}`,
        title: "C1-new",
        salary: +`${job.salary}`,
        equity: +`${job.equity}`,
        company_handle: `${job.company_handle}`
        
      },
    });
  });
  test("FAILS for non ADMIN users", async function () {
    const resp = await request(app).get(`/jobs/c2`)
    const job = resp.body.jobs[0]
    const resp2 = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          title: "C1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp2.statusCode).toEqual(401);
  })

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found job", async function () {
    const resp = await request(app)
        .patch(`/companies/9999999`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app).get(`/jobs/c2`)
    const job = resp.body.jobs[0]
    const resp2 = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          salary: "not-a-salary",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp2.statusCode).toEqual(400);
  });
});

/************************************** DELETE /job/:handle */

describe("DELETE /jobs/:handle", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/c1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("fails for non admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/c1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/nope`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
