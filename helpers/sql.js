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
  let search
  let clause
  
  if(data.name !== undefined) {
    search = `WHERE name ILIKE '%${data.name}%'`
    clause = 'AND'
  } else {
    search = ''
    clause = 'WHERE'
  }
  
  if(data.minEmployees && data.maxEmployees) {
    console.log('checking search ', search)
      //confirm our range will work for search
    if(data.minEmployees > data.maxEmployees || data.minEmployees === data.maxEmployees) {
      throw new BadRequestError("Error with range of Min and Max employees : INVALID !")
    } 
    search = `${search} ${clause} num_employees > ${data.minEmployees} AND num_employees < ${data.maxEmployees}` 
  } else if(data.minEmployees) {
      search = `${search} ${clause} num_employees > ${data.minEmployees}` 
  } else if(data.maxEmployees) {
      search = `${search} ${clause} num_employees < ${data.maxEmployees}`
  }
  
  let query =  `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
              FROM companies 
              ${search}`
  console.log('query ', query)

  return query    

}

module.exports = { sqlForPartialUpdate, generateSearchQuery };
