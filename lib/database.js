var mysql = require('mysql');
const config = {
	host: "localhost",
	user: "root",
	password: "root"
}
var con = mysql.createConnection(config);

con.connect();
// class Database {
//     constructor( config ) {
//         this.connection = mysql.createConnection( config );
//     }
//     query( sql, args ) {
//         return new Promise( ( resolve, reject ) => {
//             this.connection.query( sql, args, ( err, rows ) => {
//                 if ( err )
//                     return reject( err );
//                 resolve( rows );
//             } );
//         } );
//     }
//     close() {
//         return new Promise( ( resolve, reject ) => {
//             this.connection.end( err => {
//                 if ( err )
//                     return reject( err );
//                 resolve();
//             } );
//         } );
//     }
// }
exports.con = con;
exports.mysql = mysql;
// exports.db = new Database(config)