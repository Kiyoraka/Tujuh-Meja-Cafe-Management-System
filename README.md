# Tujuh Meja Cafe — Reservation & Waitlist

A table reservation and walk-in waitlist system for a small cafe with seven tables. Guests book a table or join the queue by QR code, and the owner runs the floor, the bookings, the queue and the tables from one dashboard.

**Live demo:** https://kiyoraka.github.io/Tujuh-Meja-Cafe-Management-System/

**Sign in:** one dialog with two tabs. **Customer** shows your bookings and queue place, and **Staff** opens the owner's dashboard. Any email and any password work on both (or press *Fill demo login*).

> This is a demo. Every guest, phone number and address is fictional, nothing is charged and no text is really sent. Bookings, the queue and the tables live only in your browser tab, so a refresh starts a fresh day.

## Features

- Online table booking with party size and time slot
- Walk-in queue by QR code with live position and estimated wait
- Floor view of every table: free, reserved, seated, cleaning
- Owner dashboard: covers, no-shows, average wait and busy hours at a glance
- Deposit against no-shows, returned at seating
- One-tap seating that moves the queue forward
- Add, edit and arrange your own tables by zone
- Guests sign in to see, and cancel, their own bookings
- Bottom navigation on phones for guests and for the owner

## Pages

| Guest | Owner (after sign-in) |
|-------|-----------------------|
| `#/` home, live floor and open times | `#/admin` dashboard |
| `#/book` book a table | `#/admin/floor` floor view |
| `#/queue` join the walk-in queue | `#/admin/bookings` reservations |
| `#/queue/me` your place in line | `#/admin/waitlist` waitlist |
| `#/account` my visits (customer sign-in) | `#/admin/tables` add and edit tables |
| `#/login` sign-in dialog (`?as=customer` for the Customer tab) | `#/admin/settings` hours, slots, deposit |

## Built with

Plain HTML, CSS and JavaScript (ES modules). No framework, no build step and no backend. Fonts are Fraunces and DM Sans from Google Fonts, and the photographs were made for this demo.

## Run it locally

The scripts are ES modules, so open the site through a small web server rather than straight from the file:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Project layout

```
index.html          page shell
css/                base.css (tokens and shared pieces), admin.css, mobile.css
js/data.js          the demo day: tables, bookings, queue, settings
js/state.js         shared state, actions and the numbers every page reads
js/sim.js           moves the day along every 25 seconds
js/router.js        hash routes
js/views/           guest pages; js/views/admin/ for the owner's pages
assets/             photographs, QR code, favicon
```
