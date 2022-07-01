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
  // if our OBject contains no data then throw an error
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

module.exports = { sqlForPartialUpdate };
