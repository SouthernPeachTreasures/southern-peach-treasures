[README.md](https://github.com/user-attachments/files/29117182/README.md)
# Southern Peach Treasures — Website

This is the website for Southern Peach Treasures. It's a simple static
site (no database, no separate backend) that automatically pulls your
current inventory from your Square account.

## What's in this folder

```
public/
  index.html       <- Home page (weekly unboxing video)
  inventory.html   <- Treasure Chest page (live inventory from Square)
  about.html       <- About page
  contact.html     <- Contact page
  style.css        <- All styling
  logo.png         <- Small logo (used in the navigation bar)
  logo-large.png   <- Larger logo (used on the About page)

functions/
  api/inventory.js <- Connects to Square and returns your item list
```

## How to deploy (Cloudflare Pages)

1. Create a GitHub account if you don't have one (github.com)
2. Create a new repository (e.g. "southern-peach-treasures")
3. Upload everything in this folder to that repository
   (drag-and-drop works fine on github.com — click "Add file" -> "Upload files")
4. Go to your Cloudflare dashboard -> Workers & Pages -> Create -> Pages
5. Connect your GitHub repository
6. Build settings:
   - Framework preset: None
   - Build command: (leave blank)
   - Build output directory: public
7. Click "Save and Deploy"

Cloudflare will give you a temporary URL like
`southern-peach-treasures.pages.dev` — the site is now live there.

## Connecting your custom domain

1. In the Cloudflare Pages project, go to "Custom Domains"
2. Click "Set up a custom domain"
3. Enter southernpeachtreasures.com (or whatever domain you registered)
4. Since the domain is already in Cloudflare, DNS will connect automatically

## Connecting Square (so the Treasure Chest page shows real items)

1. Go to developer.squareup.com and sign in
2. Create an Application (any name is fine, e.g. "Southern Peach Treasures")
3. Under that application, find:
   - Your **Access Token** (use the Production token, not Sandbox)
   - Your **Location ID** (under "Locations")
4. In Cloudflare Pages, go to your project -> Settings -> Environment Variables
5. Add two variables:
   - `SQUARE_ACCESS_TOKEN` = (paste your access token)
   - `SQUARE_LOCATION_ID`  = (paste your location ID)
6. Click Save, then re-deploy (Cloudflare may prompt you, or trigger a
   new deployment from the Deployments tab)

Once that's done, any item your aunt adds to her Square Item Library
(with a name, price, and photo) will automatically show up on the
Treasure Chest page within about a minute — no code changes needed.

## Updating the weekly unboxing video

1. Open `public/index.html`
2. Find the section that says "WEEKLY UNBOXING VIDEO — UPDATE THIS EACH WEEK"
3. Replace the placeholder between `<!-- VIDEO START -->` and
   `<!-- VIDEO END -->` with your TikTok embed code
   (On TikTok: open the video -> Share -> Embed -> Copy code)
4. Save the file and upload it back to GitHub — Cloudflare will
   automatically redeploy

## Setting up the contact form

1. Go to web3forms.com
2. Enter your email and click "Create Access Key" (it's free)
3. Open `public/contact.html`
4. Find `YOUR_ACCESS_KEY_HERE` and replace it with the key you received
5. Save and re-upload to GitHub

## A note on Square setup for your aunt

For each item she wants to sell, in her Square dashboard (Items &
Orders -> Items):
- Add a **name** (e.g. "Mystery Box Find — Bluetooth Speaker")
- Add a **price**
- Add a **photo** (this is what shows on the website)
- Add a short **description** (optional, but recommended)

That's the entire process on her end — no checkout links to create
manually, the website generates those automatically.
