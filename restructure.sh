#!/bin/bash

# Create new directory structure
mkdir -p public/{css,js,images}
mkdir -p src/{routes,controllers,middleware,utils}

# Move frontend files to public
mv "home page.html" public/index.html
mv About.html public/about.html
mv Register.html public/register.html
mv campaign-details.html public/campaign-details.html
mv contact.html public/contact.html
mv create-campaign.html public/create-campaign.html
mv dashboard.html public/dashboard.html
mv history.html public/history.html
mv login.html public/login.html
mv profile.html public/profile.html

# Move assets
mv css/* public/css/
mv js/* public/js/
mv image/* public/images/

# Clean up empty directories
rm -r css js image

# Update server.js static path
sed -i 's/express.static(path.join(__dirname))/express.static(path.join(__dirname, "public"))/' server.js
