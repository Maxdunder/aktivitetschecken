
from flask import Flask, render_template, request

app = Flask(__name__)

restaurants = [
    {"name": "Estreet", "price": 120, "image": "Vin_Estreet.webp"},
    {"name": "Pitchers", "price": 75, "image": "Öl_Pitcher.png"},
    {"name": "O'Learys", "price": 95, "image": "Öl_O-Learys.jpg"},
    {"name": "Bloco", "price": 110, "image": "Drink_bloco.png"}
]



@app.route("/")
def index():
    search_query = request.args.get("q", "").strip()
    selected_restaurants = request.args.getlist("restaurant")
    selected_prices = request.args.getlist("price")

    filtered_restaurants = restaurants
    # Sök restauranger
    if search_query:
        filtered_restaurants = [
            r for r in filtered_restaurants
            if search_query.lower() in r["name"].lower()
    ]
    # Filtrera restauranger
    if selected_restaurants:
        filtered_restaurants = [
            r for r in filtered_restaurants
            if r["name"] in selected_restaurants
        ]

    # Filtrera priser
    if selected_prices:
        price_ranges = {
            "0-100": (0, 100),
            "100-200": (100, 200),
            "200-300": (200, 300),
            "300+": (300, float("inf"))
        }

        filtered_restaurants = [
            r for r in filtered_restaurants
            if any(
                price_ranges[p][0] <= r["price"] < price_ranges[p][1]
                for p in selected_prices
            )
        ]

    sort_order = request.args.get("sort", "recommended")

    if sort_order == "descending":
        filtered_restaurants = sorted(
            filtered_restaurants,
            key=lambda restaurant: restaurant["price"],
            reverse=True
    )

    elif sort_order == "ascending":
        filtered_restaurants = sorted(
            filtered_restaurants,
            key=lambda restaurant: restaurant["price"]
    )

    return render_template(
        "Alk.html",
        restaurants=filtered_restaurants,
        selected_restaurants=selected_restaurants,
        selected_prices=selected_prices,
        sort_order=sort_order,
        search_query=search_query
    )


if __name__ == "__main__":
    app.run(debug=True)
