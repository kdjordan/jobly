"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, generateSearchQuery, filterSearchParams } = require("../helpers/sql");
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

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, company_handle }]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT title,
                  salary,
                  equity,
                  company_handle
           FROM jobs`);
    return companiesRes.rows[0];
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const jobsRes = await db.query(
                      `SELECT title,
                          salary,
                          equity,
                          company_handle
                      FROM jobs
                      WHERE company_handle = $1`
                        [handle]);
    const jobs = jobsRes.rows[0];

    if (!jobs) throw new NotFoundError(`No jobs at: ${handle}`);

    return jobs;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }

  /** Find companies based on one or more of the following criteria :
   *  1. Name like...
   *  2. Min # employees
   *  3. Max # emplyees
   *  4. Range of # employees - both Min and Max
   **/

  static async filteredSearch(data) {
    //first remove any bad search params if they exist
    //returns array of good filter names and values
    let searchParams = filterSearchParams(data)
    if(Object.keys(searchParams).length > 0) {
      let query = generateSearchQuery(searchParams)
      if(query) {
        let result = await db.query(query)
        return result.rows;  
      }
    } else {
      throw new NotFoundError(`Insufficient search query parameters !`)
    }
   
  }
}


module.exports = Job;
