import pkg from 'sequelize';
import config from "./config.js";

const {Sequelize,DataTypes} = pkg;
const sequelize = new Sequelize(config.db_name, config.db_username, config.db_password, {
    host: 'localhost',
    port : 3306,
    dialect: 'mysql'
  });

const User = sequelize.define('User',{
    "id" : {type : DataTypes.INTEGER,autoIncrement:true,primaryKey:true},
    "name" : DataTypes.STRING,
    "username" : DataTypes.STRING,
    "password" : DataTypes.STRING,
    "role" : DataTypes.STRING
})

const Product = sequelize.define('Product',{
    "id" : {type : DataTypes.INTEGER,autoIncrement:true,primaryKey:true},
    "name" : DataTypes.STRING,
    "stock" : DataTypes.INTEGER,
    "SKU" : DataTypes.STRING,
    "sellingPrice" : DataTypes.DOUBLE,
    "capitalPrice" : DataTypes.DOUBLE,
    "path" : DataTypes.STRING,
    "unit" : DataTypes.STRING
})


const Transaction = sequelize.define('Transaction',{
    "id" : {type : DataTypes.INTEGER,autoIncrement:true,primaryKey:true},
    "totalPrice" : DataTypes.DOUBLE
})
const TransactionDetail = sequelize.define('TransactionDetail',{
    "id" : {type : DataTypes.INTEGER,autoIncrement:true,primaryKey:true},
    "qty" : DataTypes.INTEGER,
    "totalPriceQty" : DataTypes.DOUBLE,
    "sellingPrice" : DataTypes.INTEGER 
})
// User.hasMany(Transaction);
// Transaction.belongsToMany(User);

Transaction.hasMany(TransactionDetail);
TransactionDetail.belongsTo(Transaction);

sequelize.sync({force:false})

export default {
    user : User,
    product : Product,
    transaction : Transaction,
    transactionDetail : TransactionDetail
}
