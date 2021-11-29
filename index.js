import express from 'express';
import verify from './verifyToken.js';
import models from "./models.js";
import crypto from "crypto";
import jwt from 'jsonwebtoken';
import config from './config.js';
import pkg from 'sequelize';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import * as fs from 'fs';

const { Op, Sequelize } = pkg;
const app = express();

app.set('view engine', 'ejs');

const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(path.resolve(), "/photos/"));
    },
    filename: function (req, file, cb) {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    },
});
const upload = multer({ storage: diskStorage })
app.use(express.json());
app.use(cors());

app.get('/invoice', async (req, res) => {
    let body = req.query;
    let transactionId = body.transactionId

    let tokoName = body.tokoName
    if (tokoName == undefined) {
        tokoName = "ATIK"
    }

    let noTelp = body.noTelp
    if (noTelp == undefined) {
        noTelp = "DEFAULT"
    }

    let address = body.address
    if (address == undefined) {
        address = "DEFAULT"
    }

    let transaction = await models.transaction.findOne({
        where: { id: transactionId },
        include: {
            model: models.transactionDetail,
            include: {
                model: models.productDetail,
                include: [{
                    model: models.product
                }],
            },
        }
    })
    let distintProduct = []
    let renderTransaction = {}

    for (let i = 0; i < transaction.TransactionDetails.length; ++i) {
        let tDetail = transaction.TransactionDetails[i]
        let pDetail = tDetail.ProductDetail

        if (distintProduct.includes(pDetail.ProductId)) {
            renderTransaction[pDetail.ProductId].totalPriceQty += tDetail.totalPriceQty
            renderTransaction[pDetail.ProductId].qty += tDetail.qty
        } else {
            renderTransaction[pDetail.ProductId] = {
                "sellingPrice": tDetail.sellingPrice,
                "name": pDetail.Product.name,
                "totalPriceQty": tDetail.totalPriceQty,
                "qty": tDetail.qty
            }
            distintProduct.push(pDetail.ProductId)
        }
    }
    let user = { "name": "test" }
    if (req.decode != undefined) {
        user = await models.user.findByPk(req.decode.id)
    }

    res.render('invoice', {
        totalPrice: transaction.totalPrice,
        transaction: renderTransaction,
        user: user.name,
        tokoName: tokoName,
        noTelp: noTelp,
        address: address
    });
})

app.get('/get/photo', (req, res) => {
    let body = req.query
    try {

        let filePath = path.join(path.resolve(), "/photos/");
        return res.sendFile(filePath + body.path)
    } catch (error) {
        return res.send({
            "status": "failed",
            "message": "file does not exist"
        })
    }
})

app.post('/login', async (req, res) => {
    let body = req.body;
    let passwordHash = crypto.createHash('sha256').update(body.password).digest('base64')

    let user = await models.user.findOne({
        where: { username: body.username, password: passwordHash }
    });

    if (user) {
        let payload = {
            id: user.id,
            role: user.role
        };

        let loginLog = await models.loginLog.create({
            UserId: user.id,
            status: "IN"
        })
        if (user.role == 'kasir') {
            loginLog.initialMoney = body.initialMoney
            await loginLog.save()
        }
        let token = jwt.sign(payload, config.secret_key);
        return res.send({
            "status": "ok",
            "username": user.username,
            "role": user.role,
            token
        });
    }
    return res.send({
        "status": "failed"
    })
})
app.post('/logout', verify.verify, async (req, res) => {
    let body = req.body
    try {
        let loginLog = await models.loginLog.findOne({
            where: {
                userId: req.decode.id,
                status: "IN"
            }
        })
        loginLog.status = "OUT"

        if (req.decode.role == "kasir") {
            loginLog.finalMoney = body.finalMoney
        }
        loginLog.logoutAt = Date.now()
        await loginLog.save()
        return res.send({
            "status": "ok"
        })
    } catch (error) {
        return res.send({
            "status": "failed",
            "error": error
        })
    }
})
app.post('/get/login/log', async (req, res) => {
    let body = req.body

    try {
        let bod = new Date(body.from_date)
        bod = new Date(bod.getFullYear(), bod.getMonth(), bod.getDate(), 0, 0, 0);
        let eod = new Date(body.to_date)
        eod = new Date(eod.getFullYear(), eod.getMonth(), eod.getDate(), 23, 59, 59);

        let loginLogs = await models.loginLog.findAll({
            where : {
                createdAt : {
                    [Op.gte] :bod,
                    [Op.lte] : eod
                },
                status : "OUT"
            },
            include: [
                {
                    model: models.transaction,

                    include: [{
                        model: models.transactionDetail,
                        include: models.productDetail
                    }]
                },
                models.user
            ]
        })
        let results = []
        for (let i = 0; i < loginLogs.length; ++i) {
            let total_jual = 0;
            let total_modal = 0;
            let transaction = loginLogs[i].Transactions
            let logs = loginLogs[i]
            for (let i = 0; i < transaction.length; ++i) {
                let tdetails = transaction[i].TransactionDetails
                for (let j = 0; j < tdetails.length; ++j) {
                    total_modal += tdetails[i].ProductDetail.capitalPrice * tdetails[i].qty
                    total_jual += tdetails[i].totalPriceQty
                }
            }
            let spending = await models.spendingLog.findAll({
                where: {
                    createdAt: {
                        [Op.gte]: logs.createdAt,
                        [Op.lte]: logs.logoutAt
                    }
                }
            })
            let total_spending = 0;
            for (let i = 0; i < spending.length; ++i) {
                total_spending += spending[i].expense
            }
            let temp = {
                "initialMoney": logs.initialMoney,
                "user": logs.User.name,
                "finalMoney": logs.finalMoney,
                "totalSales": total_jual,
                "totalCapital": total_modal,
                "loginAt": logs.createdAt,
                "logoutAt": logs.logoutAt,
                "totalSpend": total_spending
            }
            results.push(temp)
        }
        return res.send({
            status: "ok",
            data: results
        })
    } catch (error) {
        return res.send({
            status: "failed",
            msg: error.toString()
        })
    }
})
app.post('/register', async (req, res) => {
    let body = req.body
    let passwordHash = crypto.createHash('sha256').update(body.password).digest('base64')
    try {
        let user = await models.user.create({
            "name": body.name,
            "username": body.username,
            "password": passwordHash,
            "role": body.role,
        })
        return res.send({
            "status": "ok"
        })
    } catch (error) {
        return res.send({
            "status": "failed"
        })
    }

});

app.post('/create/supplier', verify.verify, async (req, res) => {
    let body = req.body

    try {
        let supplier = await models.supplier.create({
            name: body.name
        })
        return res.send({
            status: "ok",
            data: supplier
        })
    } catch (error) {
        return res.send({
            status: "failed",
            msg: error
        })
    }
})
app.post("/get/supplier", verify.verify, async (req, res) => {
    let body = req.body
    try {
        let supplier = await models.supplier.findAll()
        return res.send({
            status: "ok",
            data: supplier
        })
    } catch (error) {

    }
})
app.post('/get/products/supplier', verify.verify, async (req, res) => {
    let body = req.body

    try {
        let data = await models.supplier.findOne({
            where: {
                id: body.id
            },
            include: models.productDetail
        })
        return res.send({
            "status": "ok",
            products: data
        })
    } catch (error) {
        return res.send({
            "status": "failed",
            msg: error
        })
    }
})

app.post('/get/product/details', verify.verify, async (req, res) => {
    const body = req.body
    try {
        let productDetails = await models.productDetail.findAll({
            where: {
                ProductId: body.ProductId,
                SupplierId: body.SupplierId
            }
        })
        return res.send({
            status: "ok",
            data: productDetails
        })
    } catch (error) {
        return res.send({
            status: "failed",
            error: error.toString()
        })
    }
})

app.post("/update/product/details", verify.verify, async (req, res) => {
    let body = req.body
    try {
        let productDetail = await models.productDetail.findByPk(body.id);

        if (body.capitalPrice) {
            productDetail.capitalPrice = body.capitalPrice
        }
        if (body.stock) {
            productDetail.stock = body.stock
        }
        await product.save()
        return res.send({
            "status": "ok"
        })
    } catch (err) {
        return res.send({
            "status": "failed",
            err
        })
    }
})
/*

{
    supplierId : 1,
    expense : 1000
    products : [
        {
            product : {
                "name": body.name,
                "SKU": body.SKU,
                "path": path,
                "unit": body.unit
            },
            capitalPrice : 1000,
            stock : 10,
            status : "new_product"
        },
        {
            productId : 1,
            capitalPrice: 1000,
            stock: 1000,
            status : "new_price"
        },
        {
            productDetailId: 1,
            stock:10,
            status: "add_stock"
        }
    ]

          // {
        //     "productId" : 1,
        //     "capitalPrice": 1000,
        //     "stock": 1000,
        //     "status" : "new_price"
        // },
        // {
        //     "productDetailId": 1,
        //     "stock":10,
        //     "status": "add_stock"
        // }
}
 */
app.post('/get/purchased/log', verify.verify, async (req, res) => {
    let body = req.body

    try {
        let purchasedLog = await models.purchasedLog.findAll({
            include: [
                {
                    model: models.purchasedLogDetail,
                    include: [
                        {
                            model: models.productDetail,
                            include: models.product
                        }
                    ]
                },
                models.spendingLog,
                models.supplier
            ],
        })
        return res.send({
            status: "ok",
            data: purchasedLog
        })
    } catch (error) {
        return res.send({
            status: "failed",
            msg: error.toString()
        })
    }
})
app.post('/create/purchased/log', [verify.verify, upload.single("photo")], async (req, res) => {
    let body = req.body

    try {
        let supplierId = body.supplierId;
        let products = body.products;
        let expense = await models.spendingLog.create({
            name: "ekspedisi",
            expense: body.expense,
            UserId: req.decode.id,
            note: "barang masuk"
        })
        let purchasedLog = await models.purchasedLog.create({
            SpendingLogId: expense.id,
            SupplierId: supplierId
        })
        let totalCapitalPrice = 0
        for (let i = 0; i < products.length; ++i) {
            let path;
            if (!req.file) {
                path = 'default.jpg'
            } else {
                path = req.file.filename
            }
            let product = products[i];

            if (product.status === 'new_price') {
                let productDetail = await models.productDetail.create({
                    SupplierId: supplierId,
                    ProductId: product.productId,
                    capitalPrice: product.capitalPrice,
                    stock: product.stock,
                })
                totalCapitalPrice += product.capitalPrice * product.stock
                await models.purchasedLogDetail.create({
                    PurchasedLogId: purchasedLog.id,
                    ProductDetailId: productDetail.id,
                    stock: product.stock
                })
            } else if (product.status === "add_stock") {
                let productDetail = await models.productDetail.findOne({
                    where: { id: product.productDetailId }
                })
                productDetail.stock += product.stock
                await productDetail.save()

                totalCapitalPrice += productDetail.capitalPrice * product.stock
                await models.purchasedLogDetail.create({
                    PurchasedLogId: purchasedLog.id,
                    ProductDetailId: productDetail.id,
                    stock: product.stock
                })
            } else if (product.status === "new_product") {
                let newProduct = product.product
                newProduct = await models.product.create({
                    "name": newProduct.name,
                    "SKU": newProduct.SKU,
                    "path": path,
                    "unit": newProduct.unit
                })
                let productDetail = await models.productDetail.create({
                    SupplierId: supplierId,
                    ProductId: newProduct.id,
                    capitalPrice: product.capitalPrice,
                    stock: product.stock,
                })
                totalCapitalPrice += product.capitalPrice * product.stock
                await models.purchasedLogDetail.create({
                    PurchasedLogId: purchasedLog.id,
                    ProductDetailId: productDetail.id,
                    stock: product.stock
                })
            }
        }
        purchasedLog.total = totalCapitalPrice
        await purchasedLog.save()

        return res.send({
            status: "ok"
        })
    } catch (error) {
        return res.send({
            status: "failed",
            msg: error
        })
    }
})
app.post('/delete/purchased/log', verify.verify, async (req, res) => {
    let body = req.body
    try {
        let purchasedLog = await models.purchasedLog.findOne({
            where: {
                id: body.purchasedLogId
            }, include: models.purchasedLogDetail
        })
        let purchasedLogDetails = purchasedLog.PurchasedLogDetails
        for (let i = 0; i < purchasedLogDetails.length; ++i) {
            let purchasedLogDetail = purchasedLogDetails[i]

            let productDetail = await models.productDetail.findByPk(purchasedLogDetail.ProductDetailId)
            productDetail.stock -= purchasedLogDetail.stock
            if (productDetail.stock == 0) {
                await productDetail.destroy()
            } else {
                await productDetail.save()
            }
            await purchasedLogDetail.destroy()
        }
        await purchasedLog.destroy()
        return res.send({
            status: "ok"
        })
    } catch (error) {
        return res.send({
            status: "failed",
            msg: error.toString()
        })
    }
})
app.post('/update/purchased/log', verify.verify, async (req, res) => {
    let body = req.body

    try {
        let purchasedLog = await models.purchasedLog.findByPk(body.purchasedLogId)

        purchasedLog.status = body.status
        await purchasedLog.save()
        return res.send({
            status: "ok",
        })
    } catch (error) {
        return res.send({
            status: "failed",
            msg: error.toString()
        })
    }
})
app.post('/update/purchased/log', verify.verify, async (req, res) => {
    let body = req.body
    try {
        let purchasedLog = await models.purchasedLog.findByPk(body.purchasedLogId)

        purchasedLog.status = body.status
        await purchasedLog.save()
        return res.send({
            status: "ok",
        })
    } catch (error) {
        return res.send({
            status: "failed",
            msg: error.toString()
        })
    }
})
app.post('/create/product', [upload.single("photo"), verify.verify], async (req, res) => {
    let body = req.body

    let path;
    if (!req.file) {
        path = 'default.jpg'
    } else {
        path = req.file.filename
    }
    try {
        let product = await models.product.create({
            "name": body.name,
            "SKU": body.SKU,
            // "sellingPrice": body.sellingPrice,
            "stock": body.stock,
            "path": path,
            "unit": body.unit
        })
        if (body.sellingPrice) {
            product.sellingPrice = body.sellingPrice;
            await product.save()
        }
        return res.send({
            "status": "ok",
            data: product
        })
    } catch (error) {
        return res.send({
            "status": "failed",
            error
        })
    }
})
app.post('/search/product', verify.verify, async (req, res) => {
    let body = req.body
    try {

        let products = await models.product.findAll({
            where: {
                "name": {
                    [Op.like]: `%${body.product_name}%`
                }
            }
        })
        return res.send({
            status: "ok",
            data: products
        })
    } catch (error) {
        return res.send({
            status: "failed",
            error
        })
    }
})
app.post('/get/product/dashboard', verify.verify, async (req, res) => {
    let body = req.body
    try {
        let products = await models.product.findAll({
            where: {
                sellingPrice: {
                    [Op.gt]: 0
                }
            },
            include: models.productDetail
        });

        for (let i = 0; i < products.length; ++i) {
            let productDetail = products[i].ProductDetails
            let stock = 0;
            for (let j = 0; j < productDetail.length; ++j) {
                stock += productDetail[j].stock - productDetail[j].usedStock
            }
            products[i].setDataValue('stock', stock)
        }
        return res.send({
            status: "ok",
            data: products
        })
    } catch (error) {
        return res.send({
            status: "failed",
            error: error.toString()
        })
    }
})
app.post('/get/product/purchased', verify.verify, async (req, res) => {
    let body = req.body
    try {
        let products = await models.product.findAll({
            include: models.productDetail
        });
        for (let i = 0; i < products.length; ++i) {
            let productDetail = products[i].ProductDetails
            let stock = 0;
            for (let j = 0; j < productDetail.length; ++j) {
                stock += productDetail[j].stock - productDetail[j].usedStock
            }
            products[i].setDataValue('stock', stock)
        }
        return res.send({
            status: "ok",
            data: products
        })
    } catch (error) {
        return res.send({
            status: "failed",
            error: error.toString()
        })
    }
})
app.post('/retrieve/product', verify.verify, async (req, res) => {
    let body = req.body

    try {
        let product = await models.product.findOne({
            where: { SKU: body.SKU }
        })
        return res.send({
            "status": "ok",
            "data": product
        })
    } catch (error) {
        return res.send({
            status: "failed",
            error
        })
    }
})

app.post('/update/product', [upload.single("photo"), verify.verify], async (req, res) => {
    let body = req.body
    try {
        let product = await models.product.findByPk(body.id);
        if (body.name) {
            product.name = body.name
        }
        if (body.SKU) {
            product.SKU = body.SKU
        }
        if (body.sellingPrice) {
            product.sellingPrice = body.sellingPrice
        }
        if (body.unit) {
            product.unit = body.unit
        }
        if (req.file) {
            let pathfile = path.join(path.resolve(), "/photos/")

            fs.unlink(pathfile + product.path, (err) => {
                if (err && err.code == 'ENOENT') {
                    // file doens't exist
                    console.info("File doesn't exist, won't remove it.");
                } else if (err) {
                    // other errors, e.g. maybe we don't have enough permission
                    console.error("Error occurred while trying to remove file");
                } else {
                    console.info(`removed`);
                }
            })
            product.path = req.file.filename
        }
        await product.save()
        return res.send({
            "status": "ok"
        })

    } catch (error) {
        return res.send({
            "status": "failed",
            error
        })
    }
})

app.post('/delete/product', verify.verify, async (req, res) => {
    let body = req.body
    try {
        let pathfile = path.join(path.resolve(), "/photos/")
        let product = await models.product.findByPk(body.id)
        fs.unlink(pathfile + product.path, (err) => {
            if (err && err.code == 'ENOENT') {
                // file doens't exist
                console.info("File doesn't exist, won't remove it.");
            } else if (err) {
                // other errors, e.g. maybe we don't have enough permission
                console.error("Error occurred while trying to remove file");
            } else {
                console.info(`removed`);
            }
        })
        await models.product.destroy({
            where: {
                id: body.id
            }
        })
        return res.send({
            "status": "ok"
        })
    } catch (error) {
        return res.send({
            "status": "failed",
            error: error.toString()
        })
    }
})

app.post('/order/product', verify.verify, async (req, res) => {
    let body = req.body
    try {
        const result = await models.sequelize.transaction(async (t) => {
            let transaction = await models.transaction.create({}, { transaction: t })
            let loginLog = await models.loginLog.findOne({
                where: {
                    UserId: req.decode.id,
                    status: "IN"
                }
            }
            )
            transaction.LoginLogId = loginLog.id
            let totalPrice = 0;
            for (let i = 0; i < body.products.length; ++i) {
                let product = body.products[i]
                let qty = product.quantity
                product = await models.product.findByPk(product.id)
                let productDetail = await models.productDetail.findAll({
                    where: {
                        ProductId: product.id,
                        stock: {
                            [Op.gt]: Sequelize.col('usedStock')
                        }
                    }
                })
                let x = 0;
                while (qty > 0) {
                    const available_stock = productDetail[x].stock - productDetail[x].usedStock
                    const min_qty = Math.min(available_stock, qty)
                    let totalPriceQty = min_qty * product.sellingPrice
                    qty -= min_qty

                    let transactionDetail = await models.transactionDetail.create({
                        ProductDetailId: productDetail[x].id,
                        qty: min_qty,
                        totalPriceQty: totalPriceQty,
                        TransactionId: transaction.id,
                        sellingPrice: product.sellingPrice,
                    }, { transaction: t })
                    productDetail[x].usedStock += min_qty;
                    await productDetail[x].save({ transaction: t })

                    totalPrice += totalPriceQty;
                    x++;
                }
            }
            transaction.totalPrice = totalPrice
            await transaction.save({ transaction: t })
            return transaction
        })

        return res.send({
            "status": "ok"
        })
    } catch (error) {
        return res.send({
            status: "failed"
        })
    }

})

app.post('/get/transaction/detail', verify.verify, async (req, res) => {
    let body = req.body
    try {
        let transaction = await models.transaction.findAll({
            include: [
                {
                    model: models.transactionDetail,
                    include: [{
                        model: models.productDetail,
                        include: [{
                            model: models.product
                        }]
                    }]
                }
            ]
        })
        let data = []
        for (let i = 0; i < transaction.length; ++i) {
            let prodUnique = []
            let tDetail = transaction[i].TransactionDetails
            for (let j = 0; j < tDetail.length; ++j) {
                let productDetail = tDetail[j].ProductDetail
                let flag = 0
                for (let k = 0; k < prodUnique.length; ++k) {
                    if (productDetail.ProductId == prodUnique[k].id) {
                        prodUnique[k].qty += tDetail[j].qty
                        prodUnique[k].totalPriceQty += tDetail[j].totalPriceQty
                        flag = 1
                        break;
                    }
                }
                if (flag == 0) {
                    prodUnique.push({
                        id: productDetail.ProductId,
                        name: productDetail.Product.name,
                        qty: tDetail[j].qty,
                        totalPriceQty: tDetail[j].totalPriceQty,
                        sellingPrice: tDetail[j].sellingPrice,
                        unit: productDetail.Product.unit
                    })
                }
            }
            data.push({ detail: prodUnique, transaction_id: transaction[i].id, createdAt: transaction[i].createdAt, totalPrice: transaction[i].totalPrice })
        }
        return res.send({
            "status": "ok",
            "data": data
        })
    } catch (error) {
        return res.send({
            "status": "failed",
            "msg": error.toString()
        })
    }

})

app.post('/retrieve/transaction/detail', verify.verify, async (req, res) => {
    let body = req.body
    try {
        let transaction = await models.transaction.findByPk(body.transaction_id,
            {
                include: [
                    {
                        model: models.transactionDetail,
                        include: [{
                            model: models.productDetail,
                            include: [{
                                model: models.product
                            }]
                        }]
                    }
                ]

            })
        return res.send({
            "status": "ok",
            "data": transaction
        })
    } catch (error) {
        return res.send({
            "status": "failed"
        })
    }

})

/* 
data = 
{
    transaction_id : 1,
    data : [
        {
            product_id:1,
            qty : 10
        }
    ]
}
*/
app.post('/transaction/return', verify.verify, async (req, res) => {
    let body = req.body

    try {
        for (let i = 0; i < body.data.length; ++i) {
            let product_id = body.data[i].product_id
            let transaction = await models.transactionDetail.findAll({
                where: {
                    TransactionId: body.transaction_id
                },
                include: [
                    {
                        model: models.productDetail,
                        where: {
                            ProductId: product_id
                        }
                    }
                ]
            })
            let qty = body.data[i].qty_return
            let x = 0
            let totalPriceRet = 0
            while (qty > 0) {
                let productDetail = transaction[x].ProductDetail
                let min_stock = Math.min(qty, productDetail.usedStock)
                productDetail.usedStock -= min_stock

                transaction[x].qty -= min_stock
                await productDetail.save()
                totalPriceRet += transaction[x].sellingPrice * min_stock

                if (transaction[x].qty == 0) {
                    await transaction[x].destroy()
                } else {
                    transaction[x].totalPriceQty -= min_stock * transaction[x].sellingPrice
                    await transaction[x].save()
                }
                x++
                qty -= min_stock

            }
            let transaction_parent = await models.transaction.findByPk(body.transaction_id)
            transaction_parent.totalPrice -= totalPriceRet
            if (transaction_parent.totalPrice == 0) {
                await transaction_parent.destroy()
            }
            await transaction_parent.save()
        }
        return res.send({
            "status": "ok"
        })

    } catch (error) {
        return res.send({
            "status": "failed",
            msg: error.toString()
        })
    }


})
app.post('/get/expense', verify.verify, async (req, res) => {
    let body = req.body

    try {
        let spending = await models.spendingLog.findAll({
            include: { all: true }
        })
        return res.send({
            "status": "ok",
            data: spending
        })
    } catch (error) {
        return res.send({
            "status": "failed",
            msg: error.toString()
        })
    }
})
app.post('/create/expense', verify.verify, async (req, res) => {
    let body = req.body
    try {

        let spending = await models.spendingLog.create({
            name: body.name,
            note: body.note,
            createdAt: body.createdAt,
            UserId: req.decode.id
        })
        let expense = body.expense
        if (body.productId) {
            let productDetail = await models.productDetail.findAll({
                where: {
                    ProductId: body.productId,
                    stock: {
                        [Op.gt]: Sequelize.col('usedStock')
                    }
                },
            })
            let x = 0
            let qty = body.stock
            let totalExpense = 0;
            while (qty > 0) {
                const available_stock = productDetail[x].stock - productDetail[x].usedStock
                const min_qty = Math.min(available_stock, qty)
                qty -= min_qty

                let spendingLogDetail = await models.spendingLogDetail.create({
                    SpendingLogId: spending.id,
                    stock: min_qty,
                    ProductDetailId: productDetail[x].id
                })
                productDetail[x].usedStock += min_qty;
                totalExpense += min_qty * productDetail[x].capitalPrice
                await productDetail[x].save()
                x++;
            }
            expense = totalExpense
            spending.ProductId = body.productId
        }
        spending.expense = expense

        await spending.save()
        return res.send({
            status: "ok"
        })
    } catch (error) {
        return res.send({
            status: "failed",
            msg: error.toString()
        })
    }
})
app.post('/delete/expense', verify.verify, async (req, res) => {
    let body = req.body

    try {
        let expense = await models.spendingLog.findOne({
            where: {
                id: body.expenseId
            },
            include: [{
                model: models.spendingLogDetail,
                include: models.productDetail
            }
            ]
        });

        if (expense.SpendingLogDetails) {
            for (let i = 0; i < expense.SpendingLogDetails.length; ++i) {
                let productDetail = expense.SpendingLogDetails[0].ProductDetail
                productDetail.usedStock -= expense.SpendingLogDetails[0].stock

                await productDetail.save()
            }
        }
        await expense.destroy()
        return res.send({
            status: "ok",
        })
    } catch (error) {
        return res.send({
            status: "failed",
            msg: error.toString()
        })
    }
})
app.post("/report/spending", verify.verify, async (req, res) => {
    let body = req.body
    let bod = new Date(body.from_date)
    bod = new Date(bod.getFullYear(), bod.getMonth(), bod.getDate(), 0, 0, 0);
    let eod = new Date(body.to_date)
    eod = new Date(eod.getFullYear(), eod.getMonth(), eod.getDate(), 23, 59, 59)
    try {
        let spending = await models.spendingLog.findAll({
            where: {
                createdAt: {
                    [Op.gte]: bod,
                    [Op.lte]: eod
                }
            }
        })
        let total_sum = 0;
        for (let i = 0; i < spending.length; ++i) {
            total_sum += spending[i].expense
        }
        return res.send({
            status: "ok",
            total_keluar: total_sum
        })
    } catch (error) {
        return res.send({
            status: "failed",
            msg: error
        })
    }
})
app.post("/report/sales", verify.verify, async (req, res) => {
    let body = req.body
    let bod = new Date(body.from_date)
    bod = new Date(bod.getFullYear(), bod.getMonth(), bod.getDate(), 0, 0, 0);
    let eod = new Date(body.to_date)
    eod = new Date(eod.getFullYear(), eod.getMonth(), eod.getDate(), 23, 59, 59);
    try {
        let tdetails = await models.transactionDetail.findAll({
            where: {
                createdAt: {
                    [Op.gte]: bod,
                    [Op.lte]: eod
                },
            },
            include: models.productDetail
        })
        let total_jual = 0;
        let total_modal = 0;
        for (let i = 0; i < tdetails.length; ++i) {
            total_modal += tdetails[i].ProductDetail.capitalPrice * tdetails[i].qty
            total_jual += tdetails[i].totalPriceQty
        }
        return res.send({
            status: "ok",
            total_jual,
            total_modal,
            total_bersih: total_jual - total_modal
        })
    } catch (error) {
        return res.send({
            status: "failed",
            msg: error
        })
    }
})
app.listen(3000);

/**
 * print receipt
 * startup service (backend,frontend,database)
 *
 */
/**
 * @patch 2
 * refactor architecture backend, modular
 * distributed application (using cloud)
 * create testing for API
 * fix bugs and log error
 * transaction return
 * transaction detail
 * spending
 */
