"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: 'Engineer 1',
    salary: 150000,
    equity: .10,
    company_handle: 'c1'
  };

  test("works", async function () {
    let job = await Job.create(newJob);
  
    expect(job).toEqual(newJob);
    

    const result = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'Engineer 1'`);
    expect(result.rows).toEqual([
      {
        title: 'Engineer 1',
        salary: 150000,
        equity: .10,
        company_handle: 'c1'
      },
    ]);
  });


});

/************************************** findAll */

describe("get  jobs", function () {
  test("all jobs works", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual({
     title: 'j1',
     salary: 150000,
     equity: .10,
     company_handle: 'c1'
    },
    {
     title: 'j2',
     salary: 75000,
     equity: 0,
     company_handle: 'c2'
    });
  });

/************************************** get */

  test("not found any jobs at company_handle", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("find jobs at company_handle with title", async function () {
    let searchData = {
      title: 'j'
    }
    try {
      let jobs = await Job.filteredSearch(searchData, 'job');
      expect(jobs).toEqual([{
        title: 'j1',
        salary: 150000,
        equity: 0.1,
        company_handle: 'c1'
       },
       {
        title: 'j2',
        salary: 75000,
        equity: 0,
        company_handle: 'c2'
       }]);
      
    } catch (err) {
      console.log('err ', err)
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("find jobs at company_handle with minSalary", async function () {
    let searchData = {
      minSalary: 140000
    }
    try {
      let jobs = await Job.filteredSearch(searchData, 'job');
      expect(jobs).toEqual([{
        title: 'j1',
        salary: 150000,
        equity: 0.1,
        company_handle: 'c1'
       }]);
      
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New Job",
    salary: 200
  };

  test("works", async function () {
    let updateJob = await Job.get('c1')
    let job = await Job.update(updateJob.id, updateData);

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
            FROM jobs
            WHERE id = ${job.id}`);
    expect(result.rows).toEqual([{
      title: `${job.title}`,
      salary: +`${job.salary}`,
      equity: +`${job.equity}`,
      company_handle:`${job.company_handle}`,
      id: +`${job.id}`
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(9999999, updateData);
      fail();
    } catch (err) {
        console.log('error ', err)
        expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      let updateJob = await Job.get('c1')
      await Job.update(updateJob.id, {});
      fail();
    } catch (err) {
      console.log('error ', err)
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let deleteJob = await Job.get('c1')
    console.log('delete job ', deleteJob.id)
    await Job.remove(`${deleteJob.id}`);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id = ${deleteJob.id}`);
    expect(res.rows[0]).toEqual(undefined);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(999999)
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
