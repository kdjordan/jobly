"use strict";

const db = require("../db");
const {  NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, generateSearchQuery, filterSearchParams, generateJobSearchQuery } = require("../helpers/sql");

// Fix for parsing of numeric fields :: returns proper value for equity
var types = require('pg').types
types.setTypeParser(1700, 'text', parseFloat);
/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job for a company.
   *
   * data should be { title, salary, equity, company_handle }
   * 
   * Returns { title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job with company already in database.
   * */

  static async create({ title, salary, equity, company_handle }) {
    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle`,
        [
          title,
          salary,
          equity,
          company_handle,
        ],
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job at: ${title}`);

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, company_handle }]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT title,
                  salary,
                  equity,
                  company_handle
           FROM jobs`);
    return jobsRes.rows;
  }

  /** Given a company handle, return jobs about company.
   *
   * Returns { title, salary, equity, company_handle }
   *   where jobs are from company handle
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const jobsRes = await db.query(
                      `SELECT id, 
                          title,
                          salary,
                          equity,
                          company_handle
                      FROM jobs
                      WHERE company_handle = $1`,
                        [handle]);
    const jobs = jobsRes.rows;

    if (!jobs) throw new NotFoundError(`No jobs at: ${handle}`);

    return jobs;
  }
  /** Given a job ID return info about the job
   *
   * Returns { title, salary, equity, company_handle }
   *   where jobs are from job id
   *
   **/

  static async getById(id) {
    const jobsRes = await db.query(
                      `SELECT id, 
                          title,
                          salary,
                          equity,
                          company_handle
                      FROM jobs
                      WHERE id = $1`,
                        [id]);
    const jobs = jobsRes.rows;

    if (!jobs) throw new NotFoundError(`No jobs at: ${id}`);

    return jobs;
  }

  /** Update job with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data,{});
  
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id,
                                title, 
                                salary, 
                                equity, 
                                company_handle`;                        
    const result = await db.query(querySql, [...values, id]);
  
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
    
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE company_handle = $1
           RETURNING company_handle`,
        [handle]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No handle: ${handle}`);
  }

  /** Find companies based on one or more of the following criteria :
   *  1. Name like...
   *  2. Min # employees
   *  3. Max # emplyees
   *  4. Range of # employees - both Min and Max
   **/

  static async filteredSearch(data, type) {
    //type = type of filtered search : either company or job
    //first remove any bad search params if they exist
    //returns array of good filter names and values
    let searchParams = filterSearchParams(data)
    if(Object.keys(searchParams).length > 0 && type === 'company') {
      let query = generateSearchQuery(searchParams)
      if(query) {
        let result = await db.query(query)
        return result.rows;  
      }
    } else if(Object.keys(searchParams).length > 0 && type === 'job') {
        let query = generateJobSearchQuery(searchParams)
        if(query) {
          let result = await db.query(query)
          return result.rows;  
        }
    }
    throw new NotFoundError(`Insufficient search query parameters !`)
   
  }
}


module.exports = Job;
