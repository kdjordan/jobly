"use strict";

const { sqlForPartialUpdate } = require('./sql')
const { BadRequestError } = require("../expressError");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
  } = require("../routes/_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// await User.register({
//     username: "u1",
//     firstName: "U1F",
//     lastName: "U1L",
//     email: "user1@user.com",
//     password: "password1",
//     isAdmin: false,
//   });

let updateSchema, noData, partialUserData, fullCompanyData

beforeEach(() => {
    updateSchema = {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
    }

    noData = {}
    partialUserData = {
        firstName: 'NewFirst',
        isAdmin: false
    }
    fullCompanyData = {
        numEmployees: '666',
        logoUrl: 'httl://newlogo.com'
    }

})

afterEach(() => {
    console.log('done')
})

describe("test no user data", function () {
    test("Fails", async function () {
        expect(() => {sqlForPartialUpdate(noData, updateSchema) }).toThrow(BadRequestError);
    })
})
describe("test good update", function () {
    test("Success", async function () {
        const { setCols, values } = sqlForPartialUpdate(partialUserData, updateSchema)
        expect(values).toBeInstanceOf(Array)
        expect(values[0]).toEqual(partialUserData.firstName)
        expect(values[1]).toEqual(partialUserData.isAdmin)
        expect(setCols).toContain('first_name')
        expect(setCols).toContain('is_admin')
    })
})