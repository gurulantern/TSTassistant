function getParentInfo(ids){
    var query = 
    `
    SELECT first_name, email 
    FROM parents WHERE id = '${ids.parent}'
    `
  
    return queryDB(query)
  }
  
  //LEROY CHANGE
  function getStudentInfo(ids) {
    var query =
    `
    SELECT students.first_name, students.last_name, cohorts.sku, cohorts.start_datetime, factas.email, day, time
    FROM students
    JOIN cohort_enrollments ON students.id = cohort_enrollments.studentId
    JOIN cohorts ON cohort_enrollments.cohortId = cohorts.id
    JOIN facta_assignments ON cohorts.id = facta_assignments.cohortId
    JOIN factas ON facta_assignments.factaId = factas.id
    JOIN recurrences ON recurrences.id = cohorts.recurrence_id
    WHERE students.id = '${ids.student}' AND cohort_enrollments.deleted_at is null AND facta_assignments.deleted_at is null
    AND is_facilitator=1 AND factas.status != 'Retired' AND cohorts.status = 'In progress'
    AND facta_assignments.cohortId IN (SELECT id FROM cohorts WHERE status = 'In progress')
    `
  
    var result = queryDB(query);
  
    if (result.length === 0) {
      // If initial query doesn't return anything, run a simpler query.
      log("no class yet; playDemo student...moving to base query");
      var simplerQuery = 
      `
      SELECT students.first_name, students.last_name
      FROM students
      WHERE students.id = '${ids.student}'
      `
      result = queryDB(simplerQuery);
    }
  
    return result;
  }
  
  
  
  
  //function to query fps median 
  function getStudentFpsMedian(ids) {
    var query =
    `
    SELECT 
    metrics.created_at,
    metrics.value
  FROM synthesis_users
  JOIN metrics ON synthesis_users.id = metrics.userId AND metrics.namespace = 'benchmark' AND metrics.name = 'fpsMedian'
  WHERE synthesis_users.profile_type = "SQLStudent" AND synthesis_users.profile_id = '${ids.student}'
  ORDER BY metrics.created_at DESC
  LIMIT 1;
    `
  
    return queryDB(query);
  }
  
  
  
  //convert utc time-stamp to pt
  function convertToPacificTime(utcTimestamp) {
    const utcDate = new Date(utcTimestamp);
    const pacificOffset = -7 * 60; // Note to self: Pacific Time is UTC-7 (adjust this value for Daylight Saving Time)
    const pacificDate = new Date(utcDate.getTime() + pacificOffset * 60 * 1000);
    return pacificDate;
  }
  
  //function to query network speed
  function getStudentNetworkSpeed(ids) {
    var query =
    `
    SELECT 
    metrics.created_at,
    metrics.value
  FROM synthesis_users
  JOIN metrics ON synthesis_users.id = metrics.userId AND metrics.namespace = 'benchmark' AND metrics.name = 'network-speed'
  WHERE synthesis_users.profile_type = "SQLStudent" AND synthesis_users.profile_id = '${ids.student}'
  ORDER BY metrics.created_at DESC
  LIMIT 1;
    `
  
    return queryDB(query);
  }
  
  
  
  function getTstName(tstEmail) {
    var query = 
    `
    SELECT first_name
    FROM factas
    WHERE email = '${tstEmail}'
    `
  
    return queryDB(query)
  }
  
  function queryDB(query) {
    try {
      var server = '';
      var port = 3322;
      var dbName = '';
      var username = '';
      var password = '';
      var url = 'jdbc:mysql://' + server + ':' + port + '/' + dbName;
  
      
      var conn = Jdbc.getConnection(url, username, password);
      var stmt = conn.createStatement();
      var results = stmt.executeQuery(query);
      var metaData = results.getMetaData();
      var numCols = metaData.getColumnCount();
  
  
      // Columns name
      var col_names = [];
      for (var col = 0; col < numCols; col++) {
        col_names.push(metaData.getColumnLabel(col + 1));
      }
  
      // Data
      var object_data = []
      var obj = {};
      while (results.next()) {
  
        obj = {};
        for (var col = 0; col < numCols; col++) {
          obj[col_names[col]] = results.getString(col + 1)
        }
        object_data.push(obj)
      }
  
  
  
      // Close
      results.close();
      stmt.close();
  
      return object_data;
    } catch (error) {
      log('Error: ' + error.message);
    }
  }