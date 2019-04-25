# Why should you BepBop your site ?

* **Faster** load times
* **Less** requests for the server to handle and **less** requests for the client to make
* *Clean* package **=>** *easier* to move 

# What kind of website is it destined for ?

* Static sites using JS to fill the blanks


# How to use it ?

## Directory Schema

Each page has it's own directory

```
.
+-- config.json
+-- pages
|   +-- index.js
|   +-- page1
|       +-- page.html
|       +-- settings.json
|       +-- onload.js -- optional
|       +-- init.js
|       +-- page.js
|   +-- page2
|       +-- page.html
|       +-- settings.json
|       +-- onload.js
|       +-- init.js
|       +-- page.js


```

## File contents

#### page.html

Should contain the HTML content of the page

#### settings.json

JSON object containing at least two keys :
* order : int
* is_home : bool

#### onload.js

Should contain one function that will be called everytime the user loads the page

#### onquit.js

Should contain one function that will be called everytime the user lives the page

#### init.js

Should contain regular vanilla javascript
Will be run only once when the page loads

#### page.js

Should contain regular vanilla javascript
Will be run with the rest of the other pages javascript
Will run after all the inits are done


## How to import other javascript files 

In the config.json file add the url in the array **import**

## How to order the menu

The menu is numbered from left to right or top to bottom.
Set the number of each page in **settings.json** using the key __order__

## Output

The builder will produce 5 files containing your whole application.

```
.
+-- static
|   +-- router.js
|   +-- loading.gif
+-- build
|   +-- index.html
|   +-- index.css
|   +-- index.js
|   +-- map.json
|   +-- home_map.json

```

# Commands

## To build and start the development server 
```shell
$ python BepBop.py start
```

## To add a new page to the project

```shell
$ python BepBop.py new page_name
```


# Example of a config.json file

```json
{
    "last_page": 5,
    "import": [
        "/static/test.js"
    ]
}
```


# Infos

The generation of the project directory is not supported yet => just

```shell
$ mdkir pages
```


## To do

* add minify on build
* better javascript checking
* add include at compile time
