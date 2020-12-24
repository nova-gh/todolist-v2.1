// ---Installed Moduels
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
let port = process.env.PORT || 3000;

// const items = ["Buy Food", "Work out", "cook food"];
// const workItems = [];
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
//static files from pub folder
app.use(express.static("public"));
//ejs- use ejs as view engine
app.set("view engine", "ejs");
//==Mongoose Connection

mongoose.connect(
	"mongodb+srv://admin:admin413@cluster0.hgnmf.mongodb.net/todolistDB?retryWrites=true&w=majority",
	{ useNewUrlParser: true, useUnifiedTopology: true }
);
//==DB scehma
const itemsSchema = new mongoose.Schema({
	name: String,
});
//==Model(collection)
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
	name: "Todo List!",
});
const item2 = new Item({
	name: "Hit the + button to add a new item!",
});
const item3 = new Item({
	name: "<=== Hit this to delete an item.",
});
const defaultItems = [item1, item2, item3];

//==custom listSchema for custom routing
const listSchema = {
	name: String,
	items: [itemsSchema],
};
//==listSchema model
const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
	//==Find method
	Item.find({}, (err, foundItems) => {
		console.log(foundItems);
		//sending just the "name"
		// items.forEach((item) => {
		// 	console.log(item);
		// });

		//==check if defaultitems array is empty
		if (foundItems.length === 0) {
			//==Insert Method
			Item.insertMany(defaultItems, function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("items added");
				}
			});
			res.redirect("/");
		} else {
			res.render("list", { listTitle: "Today", newListItems: foundItems });
		}
	});
});
//custom route
app.get("/:customListName", (req, res) => {
	//duplicate list check
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName }, (err, foundList) => {
		if (!err) {
			if (!foundList) {
				//create a new list
				const list = new List({
					name: customListName,
					items: defaultItems,
				});
				list.save();
				res.redirect("/" + customListName);
			} else {
				//show exsisting list
				res.render("list", {
					listTitle: foundList.name,
					newListItems: foundList.items,
				});
			}
		}
	});
});

app.post("/", (req, res) => {
	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName,
	});

	//check if its default or custom list
	if (listName === "Today") {
		item.save();
		//once item is saved re route to home route and update it in found Items array
		res.redirect("/");
	} else {
		List.findOne({ name: listName }, (err, foundList) => {
			foundList.items.push(item);
			foundList.save();
			res.redirect("/" + listName);
		});
	}
});
app.post("/delete", (req, res) => {
	const checkItemID = req.body.checkBox;
	const listName = req.body.listName;
	//check if on default or custom list
	if (listName === "Today") {
		//default list
		//==db DELETE/REMOVE
		Item.findByIdAndRemove(checkItemID, (err) => {
			if (err) {
				console.log(err);
			} else {
				console.log("Deleted");
				res.redirect("/");
			}
		});
	} else {
		//custom list
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkItemID } } },
			function (err, foundList) {
				if (!err) {
					res.redirect("/" + listName);
				}
			}
		);
	}
});
app.get("/about", (req, res) => {
	res.render("about");
});
app.listen(port, () => {
	console.log(`Server is up! Local Port: ${port}!`);
});
