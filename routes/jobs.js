"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, isAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * company should be { title, salary, equity, company_handle }
 *
 * Returns { title, salary, equity, company_handle }
 *
 * Authorization required: login
 */

router.post("/", [ensureLoggedIn, isAdmin], async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    console.log(err)
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    //if we have detected some filters - pass to filteredSearch
    if(Object.keys(req.query).length > 0) {
      const jobs = await Job.filteredSearch(req.query, 'job');
      return res.json({ jobs });
    //if no filters present - return all jobs
    } else {
      const jobs = await Job.findAll();
      return res.json({ jobs });
    }
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { jobs }
 *
 *  Handle is { company_handle }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const jobs = await Job.get(req.params.handle);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, equity, salary }
 *
 * Returns { id, title, equity, salary, company_handle }
 *
 * Authorization required: login
 */

router.patch("/:job_id", [ensureLoggedIn, isAdmin], async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.job_id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", [ensureLoggedIn, isAdmin], async function (req, res, next) {
  try {
    await Job.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
