const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const _ = require('lodash');

const workItems = [];

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/todolistDB')
    .then(() => {
        console.log("connected successfully");
    }).catch(err => {
        console.error(err);
    })

const itemSchema = mongoose.Schema({
    name: String
});

const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({
    name: "Welcome to your todolist"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItem = [item1, item2, item3];

const listSchema = mongoose.Schema({
    name: String,
    items: [itemSchema]
})

const List = mongoose.model('List', listSchema);

app.get('/', function (req, res) {

    Item.find({}).then(async (foundItems) => {

        if (foundItems.length === 0) {
            await Item.insertMany(defaultItem)
                .then(() => {
                    console.log("successfully added");
                }).catch(err => {
                    console.error(err);
                })
            res.redirect('/');
        } else {
            res.render('list', { listTitle: "Today", newListItems: foundItems });
        }
    }).catch(err => {
        console.error(err);
    })

})

app.post('/', function (req, res) {

    const listName = req.body.list;
    const itemName = req.body.newItem;

    const item = new Item({
        name: itemName
    });

    if (listName != 'Today') {
        List.findOne({ name: listName }).then((list) => {
            list.items.push(item);
            list.save();
            res.redirect('/' + listName);
        }).catch(err => {
            console.error(err);
        })
    } else {
        const item = new Item({ name: req.body.newItem });
        item.save();
        res.redirect('/');
    }
});

app.get('/:customListName', function (req, res) {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }) // exists() function can also be used
        .then((foundList) => {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: []
                });

                list.save();
                res.render("list", { listTitle: customListName, newListItems: [] });
            } else {
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }).catch(err => {
            console.error(err);
        });

})

app.post('/delete', function (req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === 'Today') {
        Item.findByIdAndRemove(checkedItemId)
            .then(() => {
                console.log("Deleted successfully");
            }).catch(err => {
                console.error(err);
            })
        res.redirect('/');
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
            .then(() => {
                console.log("Deleted and Updated Successfully");
            }).catch(err=>{
                console.error(err);
            })

        res.redirect('/'+listName);
    }
});

app.get('/about', function (req, res) {
    res.render("about");
})

app.listen(3000, function () {
    console.log("Server is running on port 3000");
})