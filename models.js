import pkg from 'sequelize';
import config from "./config.js";

const { Sequelize, DataTypes } = pkg;
const sequelize = new Sequelize(config.db_name, config.db_username, config.db_password, {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    timezone: '+07:00'
});

const User = sequelize.define('User', {
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "name": DataTypes.STRING,
    "username": DataTypes.STRING,
    "password": DataTypes.STRING,
    "role": DataTypes.STRING
})

const Product = sequelize.define('Product', {
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "name": DataTypes.STRING,
    "SKU": DataTypes.STRING,
    "sellingPrice": {type: DataTypes.DOUBLE, defaultValue:0},
    "path": DataTypes.STRING,
    "unit": DataTypes.STRING
})
const ProductDetail = sequelize.define("ProductDetail",{
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "capitalPrice" : DataTypes.DOUBLE,
    "stock" : DataTypes.INTEGER,
    "usedStock" : {type: DataTypes.INTEGER,defaultValue:0}
})

const LoginLog = sequelize.define("LoginLog", {
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "initialMoney": DataTypes.DOUBLE,
    "finalMoney": DataTypes.DOUBLE,
    "status" : DataTypes.STRING
})

const Supplier = sequelize.define("Supplier", {
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "name": DataTypes.STRING,
})

const ExpeditionLog = sequelize.define("ExpeditionLog", {
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "date": DataTypes.TIME,
    "totalPrice": DataTypes.DOUBLE,
    "expeditionCost": DataTypes.DOUBLE,
    "status": DataTypes.STRING,
})

const PurchasedLog = sequelize.define("PurchasedLog", {
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "total" : DataTypes.DOUBLE,
    "status" : {type : DataTypes.STRING,defaultValue:"BELUM LUNAS"},
})
const PurchasedLogDetail = sequelize.define("PurchasedLogDetail", {
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "stock" : DataTypes.INTEGER
})

const SpendingLog = sequelize.define('SpendingLog', {
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "name": DataTypes.STRING,
    "expense": DataTypes.DOUBLE
})

const Transaction = sequelize.define('Transaction', {
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "totalPrice": DataTypes.DOUBLE
})
const TransactionDetail = sequelize.define('TransactionDetail', {
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "qty": DataTypes.INTEGER,
    "totalPriceQty": DataTypes.DOUBLE,
    "sellingPrice": DataTypes.INTEGER
})
const SpendingLogDetail = sequelize.define('SpendingLogDetail',{
    "id": { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    "stock" : DataTypes.INTEGER
})
Supplier.hasMany(ExpeditionLog);
ExpeditionLog.belongsTo(Supplier);

ExpeditionLog.hasMany(PurchasedLog);
PurchasedLog.belongsTo(ExpeditionLog);

Product.hasMany(ProductDetail)
ProductDetail.belongsTo(Product)

PurchasedLog.hasMany(PurchasedLogDetail)
PurchasedLogDetail.belongsTo(PurchasedLog)

Supplier.hasMany(PurchasedLog)
PurchasedLog.belongsTo(Supplier)

SpendingLog.hasOne(PurchasedLog)
PurchasedLog.belongsTo(SpendingLog)

ProductDetail.hasMany(PurchasedLogDetail)
PurchasedLogDetail.belongsTo(ProductDetail)

Supplier.hasMany(ProductDetail)
ProductDetail.belongsTo(Supplier)

User.hasMany(SpendingLog);
SpendingLog.belongsTo(User);

User.hasMany(LoginLog);
LoginLog.belongsTo(User);

Transaction.hasMany(TransactionDetail);
TransactionDetail.belongsTo(Transaction);

ProductDetail.hasMany(TransactionDetail);
TransactionDetail.belongsTo(ProductDetail);

Product.hasMany(SpendingLog)
SpendingLog.belongsTo(Product)

SpendingLog.hasMany(SpendingLogDetail)
SpendingLogDetail.belongsTo(SpendingLog)

ProductDetail.hasMany(SpendingLogDetail)
SpendingLogDetail.belongsTo(ProductDetail)

sequelize.sync({ force: false });


export default {
    user: User,
    product: Product,
    transaction: Transaction,
    transactionDetail: TransactionDetail,
    purchasedLog: PurchasedLog,
    spendingLog: SpendingLog,
    supplier: Supplier,
    loginLog: LoginLog,
    productDetail : ProductDetail,
    purchasedLogDetail : PurchasedLogDetail,
    spendingLogDetail : SpendingLogDetail
}
