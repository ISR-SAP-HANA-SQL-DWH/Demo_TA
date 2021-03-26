// Jenkins mocha start of the TA "mocha --delay main.js --reporter mochawesome"

//////////////////////////////////////////////////////////////////////////////////////
// Import npm packages
//////////////////////////////////////////////////////////////////////////////////////
var hanaClient = require('@sap/hana-client')
const fs = require('fs');
var assert = require('chai').assert;

//////////////////////////////////////////////////////////////////////////////////////
// Get parameters from Jenkinsfile/ Jenkins environment
//////////////////////////////////////////////////////////////////////////////////////
const WORKSPACE = process.env.WORKSPACE;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbDatabaseName = process.env.DB_NAME;
const HN_USER = process.env.HANA_TECHNICAL_USER;
const HN_PW = process.env.HANA_TECHNICAL_PASSWORD;
const SCHEMA_AL = process.env.SCHEMA_AL; 

//////////////////////////////////////////////////////////////////////////////////////
// Mocha test
//////////////////////////////////////////////////////////////////////////////////////
describe('SAP Press Testmodule', function () {
    // before(async function() {
    // })
    it('Check for the CV naming convention', async function () { 

        // Get & define parameters
        const schemaName = SCHEMA_AL;												  
        const regEx = /CV_([a-zA-Z]{1,20})/;

        // List of all CVs, that dont follow the naming convention
        var badNameCvs = []; 
        badNameCvs.push({"Description": "CVs, that dont follow the naming convention"});
        
        // Get CVs
        var calcViews = await establishConnection(dbHost, dbPort, dbDatabaseName, HN_USER, HN_PW,`SELECT DISTINCT VIEW_NAME FROM "SYS"."VIEW_COLUMNS" WHERE VIEW_NAME NOT LIKE '%/hier/%' AND SCHEMA_NAME = '` + schemaName + `'`);

        // Check the CVs for naming convention
        for (i = 0; i < calcViews.length; i++) {
            var calcView = calcViews[i]["VIEW_NAME"];
            if (calcView.match(regEx) == null){
                badNameCvs.push({"CV": calcViews[i],
                "RegExpression":  regEx.toString()});
            }
        }

        // Create log files and assert statement
        saveLogFile(WORKSPACE, badNameCvs, "badNameCvs");

        assertOutput = badNameCvs[0].Description;
        assertOutput += " -> Amount: " + (badNameCvs.length-1).toString();
        assert.strictEqual((badNameCvs.length-1), 0, assertOutput);
    })
})

//////////////////////////////////////////////////////////////////////////////////////
// Help functions
//////////////////////////////////////////////////////////////////////////////////////

// Establish SAP Hana Connection
async function establishConnection(host, port, databaseName, uid , pwd, vSqlStatement) {
    const sqlStatement = vSqlStatement;
    var conn = await hanaClient.createConnection();
    var conn_params = {
        host: host,
        port: port,
        uid: uid,
        pwd: pwd,
        databaseName: databaseName
    }

    await conn.connect(conn_params);
    const result = await conn.exec(sqlStatement);

    return result;
};

// Saving log file of the malicious SAP HANA artifacts in the jenkins workspace
function saveLogFile(logPath, logJSON, logfileName) {
    log = JSON.stringify(logJSON, null, 2);
    fs.writeFileSync(logPath + "/" + logfileName + '.json', log); 
}