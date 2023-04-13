// Import the required dependencies
const express = require("express"); // a web application framework for Node.js
const bodyParser = require("body-parser"); // middleware to parse incoming request bodies
const mongoose = require("mongoose");
const _ = require("lodash");
// Create a new instance of the express application
const app = express();

// Set the view engine to use EJS for rendering templates
app.set("view engine", "ejs");

// Use the bodyParser middleware to parse incoming form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// connect to the DB
main().catch((err) => console.log(err));

async function main() {
  mongoose.connect(
    "mongodb+srv://mateoascarrunz:Matacas18@cluster0.tnp6rix.mongodb.net/todolistDB"
  );
}
//create a SCHEMA that sets out the fields each document will have and their datatypes
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});
//create a MODEL
const Item = new mongoose.model("Item", itemsSchema);

//create a DOCUMENT
const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

// Define a route to handle GET requests to the root URL
app.get("/", function (req, res) {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Successfully saved defaul items ");
            res.redirect("/");
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        // create a new list
        const newList = new List({
          name: customListName,
          items: defaultItems,
        });

        newList.save();
        res.redirect("/" + customListName);
      } else {
        // show an existing list
        const listTitle = foundList.name;

        if (foundList && foundList.items) {
          res.render("list", {
            listTitle: listTitle,
            newListItems: foundList.items,
          });
        } else {
          res.render("list", {
            listTitle: listTitle,
            newListItems: [],
          });
        }
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listNames = req.body.list;

  console.log(listNames);

  const item = new Item({
    name: itemName,
  });
  if (listNames === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listNames })
      .then((foundList) => {
        if (foundList) {
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listNames);
        } else {
          console.log("List not found");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
});
// delete items
app.post("/delete", function (req, res) {
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  let listNamefixed;
  if (listName.length > 0 && /,(\s|\S)/.test(listName)) {
    listNamefixed = listName[0];
  } else {
    listNamefixed = listName;
  }
  console.log(listName + " is the old value");
  console.log(listNamefixed + " is the new value");

  if (listNamefixed === "Today") {
    Item.findOneAndDelete({ _id: checkItemId })
      .then(() => {
        console.log("Successfully delete item default " + listNamefixed);
        res.redirect("/");
      })
      .catch((err) => console.log(err));
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkItemId } } }
    )
      .then(() => {
        console.log(
          "Successfully delete item " + checkItemId + " from " + listNamefixed
        );
        res.redirect("/" + listNamefixed); // update listName parameter
      })
      .catch((err) => console.log(err));
  }
});

// Define a route to handle GET requests to the /about URL
app.get("/about", function (req, res) {
  // Render the "list" template and pass in the current day and work items as variables
  res.render("about");
});

// Start the server and listen on port 3000
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
