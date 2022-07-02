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
  //check to see if 'name' is present as it will change the structure of our query
  console.log('going in with ', data)
  // we have 2 basic types of queries : (1) 'name' in query and (2) no 'name' in query
  let searchString
  let nameSearchString
  let clause
  if('name' in data) {
    nameSearchString = `WHERE name ILIKE '%${data.name}%'`
    clause = 'AND'
  } else {
    nameSearchString = ''
    clause = 'WHERE'
  }

  if('maxEmployees' in data && 'minEmployees' in data) {
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

function filterSearchParams(params) {
  //make sure our filter params are what we expect, remove any bad search params
  let goodFilters = ['name', 'minEmployees', 'maxEmployees']
  let resultsObj = {}
  Object.entries(params).filter(el => {  
    if(goodFilters.indexOf(el[0]) !== -1) {
      resultsObj[`${el[0]}`] = el[1]
    } 
  })
  return resultsObj
}

module.exports = { sqlForPartialUpdate, generateSearchQuery, filterSearchParams };
