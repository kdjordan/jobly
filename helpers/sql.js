const { DataRowMessage } = require("pg-protocol/dist/messages");
const { BadRequestError } = require("../expressError");

/****************************************************************** 
 * Helper function that parses an object containing update information and sniffs out what is present. 
 * 
 * PARAMS :
 * 1. dataToUpdate = object containing some update information - what is actually contained is a mystery.
 *                    We use Object.keys to extract what properties are contained
 * 2. jsToSql = We then take the keys established in (1) and map them into SQL 'code' using the data 
 *              available in the dataToUpdate Object
*******************************************************************/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  // if our Object contains no data then throw an error
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

function generateSearchQuery(data) {
  // we have 2 basic types of queries : (1) 'name' in query and (2) no 'name' in query
  //searchString will bee added into the base query using string interpolation for return (line 58) 
  let searchString
  //nameSearchString is prepended to the query if query has 'name' (type (1) query)
  let nameSearchString
  //clause will be WITH or AND depending upon if query has 'name' (type(1) query)
  let clause
  //figure out if we have (1) :: set up our query 'framework'
  if('name' in data) {
    nameSearchString = `WHERE name ILIKE '%${data.name}%'`
    clause = 'AND'
  } else {
    nameSearchString = ''
    clause = 'WHERE'
  }

  if('maxEmployees' in data && 'minEmployees' in data) {
    //quick check to make sure our range supplied is valid
    if(data.minEmployees > data.maxEmployees || data.minEmployees === data.maxEmployees) {
      throw new BadRequestError("Error in range for Min and Max Employees")
    }
    searchString = `${nameSearchString} ${clause} num_employees > ${data.minEmployees} AND num_employees < ${data.maxEmployees}`
  }
  else if('maxEmployees' in data) {
    searchString = `${nameSearchString} ${clause} num_employees < ${data.maxEmployees}`
  }
  else if('minEmployees' in data) {
    searchString = `${nameSearchString} ${clause} num_employees > ${data.minEmployees}`
  } else {
    searchString = nameSearchString
  }
  return `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
             FROM companies 
             ${searchString}`
}

function generateJobSearchQuery(data) {
  console.log('in job')
   // we have 2 basic types of queries : (1) 'title' in query and (2) no 'title' in query
  //searchString will bee added into the base query using string interpolation for return (line 58) 
  let searchString
  //nameSearchString is prepended to the query if query has 'name' (type (1) query)
  let nameSearchString
  //clause will be WITH or AND depending upon if query has 'name' (type(1) query)
  let clause
  //figure out if we have (1) :: set up our query 'framework'
  if('title' in data) {
    nameSearchString = `WHERE title ILIKE '%${data.title}%'`
    clause = 'AND'
  } else {
    nameSearchString = ''
    clause = 'WHERE'
  }
  if(data.hasEquity && 'minSalary' in data) {
    searchString = `${nameSearchString} ${clause} equity > 0 AND salary > ${data.minSalary}`
  } else if (!data.hasEquity && 'minSalary' in data) {
    searchString = `${nameSearchString} ${clause} salary > ${data.minSalary}`
  } else if (data.hasEquity && !('minSalary' in data)){
    searchString = `${nameSearchString} ${clause} equity > 0`
  } else {
    searchString = nameSearchString
  }
  return `SELECT title,
                salary,
                equity,
                company_handle
             FROM jobs 
             ${searchString}`
}

function filterSearchParams(params) {
  //make sure our filter params are what we expect, remove any bad search params
  let goodFilters = ['name', 'minEmployees', 'maxEmployees', 'hasEquity', 'minSalary', 'title']
  let resultsObj = {}
  Object.entries(params).filter(el => {  
    if(goodFilters.indexOf(el[0]) !== -1) {
      resultsObj[`${el[0]}`] = el[1]
    } 
  })
  return resultsObj
}

module.exports = { sqlForPartialUpdate, generateSearchQuery, filterSearchParams, generateJobSearchQuery };
