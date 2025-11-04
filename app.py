from functools import total_ordering

from flask import Flask, render_template, jsonify
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
import numpy as np
import math

card_data = [
    {
        "name": "刹那のクイックブレイダー",
        "deck_counts": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 3, 2],
        "median": 3,
        "average": 2.8,
        "count_3": 11,
        "count_2": 2,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "返還の剣閃",
        "deck_counts": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        "median": 3,
        "average": 3.0,
        "count_3": 13,
        "count_2": 0,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "簒奪のアジト",
        "deck_counts": [2, 2, 3, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3],
        "median": 2,
        "average": 2.3,
        "count_3": 5,
        "count_2": 8,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "異端の侍",
        "deck_counts": [0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        "median": 0,
        "average": 0.2,
        "count_3": 0,
        "count_2": 0,
        "count_1": 3,
        "count_0": 10
    },
    {
        "name": "勇猛のルミナスランサー",
        "deck_counts": [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
        "median": 0,
        "average": 0.1,
        "count_3": 0,
        "count_2": 1,
        "count_1": 0,
        "count_0": 12
    },
    {
        "name": "簒奪の肯定者",
        "deck_counts": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        "median": 3,
        "average": 3.0,
        "count_3": 13,
        "count_2": 0,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "簒奪の祈祷者",
        "deck_counts": [3, 3, 3, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        "median": 3,
        "average": 2.9,
        "count_3": 12,
        "count_2": 1,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "信念の蹴撃・ランドル",
        "deck_counts": [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0],
        "median": 0,
        "average": 0.2,
        "count_3": 1,
        "count_2": 0,
        "count_1": 0,
        "count_0": 12
    },
    {
        "name": "干絶の顕現・ギルネリーゼ",
        "deck_counts": [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "median": 0,
        "average": 0.1,
        "count_3": 0,
        "count_2": 0,
        "count_1": 2,
        "count_0": 11
    },
    {
        "name": "試練の石板",
        "deck_counts": [3, 2, 3, 3, 3, 3, 3, 0, 3, 0, 3, 2, 3],
        "median": 3,
        "average": 2.3,
        "count_3": 9,
        "count_2": 2,
        "count_1": 0,
        "count_0": 2
    },
    {
        "name": "サイレントスナイパー・ワルツ",
        "deck_counts": [3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        "median": 3,
        "average": 2.8,
        "count_3": 11,
        "count_2": 2,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "常在戦場・カゲミツ",
        "deck_counts": [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "median": 0,
        "average": 0.0,
        "count_3": 0,
        "count_2": 0,
        "count_1": 1,
        "count_0": 12
    },
    {
        "name": "空絶の顕現・オクトリス",
        "deck_counts": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        "median": 3,
        "average": 3.0,
        "count_3": 13,
        "count_2": 0,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "燃え滾る闘志・フェザー",
        "deck_counts": [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        "median": 0,
        "average": 0.1,
        "count_3": 0,
        "count_2": 1,
        "count_1": 0,
        "count_0": 12
    },
    {
        "name": "王断の天宮・スタチウム",
        "deck_counts": [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
        "median": 0,
        "average": 0.1,
        "count_3": 0,
        "count_2": 1,
        "count_1": 0,
        "count_0": 12
    },
    {
        "name": "簒奪の団結者",
        "deck_counts": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        "median": 3,
        "average": 3.0,
        "count_3": 13,
        "count_2": 0,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "真紅と群青・ゼタ＆ベアトリクス",
        "deck_counts": [3, 3, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        "median": 3,
        "average": 2.9,
        "count_3": 12,
        "count_2": 1,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "卓越のルミナスメイジ",
        "deck_counts": [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
        "median": 0,
        "average": 0.1,
        "count_3": 0,
        "count_2": 1,
        "count_1": 0,
        "count_0": 12
    },
    {
        "name": "レヴィオンの迅雷・アルベール",
        "deck_counts": [3, 3, 3, 3, 3, 3, 3, 2, 3, 3, 3, 3, 3],
        "median": 3,
        "average": 2.9,
        "count_3": 12,
        "count_2": 1,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "リッター・シュナイト",
        "deck_counts": [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "median": 0,
        "average": 0.0,
        "count_3": 0,
        "count_2": 0,
        "count_1": 1,
        "count_0": 12
    },
    {
        "name": "簒奪の継承者・シンセライズ",
        "deck_counts": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        "median": 3,
        "average": 3.0,
        "count_3": 13,
        "count_2": 0,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "運命の黄昏・オーディン",
        "deck_counts": [3, 3, 3, 2, 3, 3, 3, 2, 3, 2, 3, 3, 3],
        "median": 3,
        "average": 2.7,
        "count_3": 10,
        "count_2": 3,
        "count_1": 0,
        "count_0": 0
    },
    {
        "name": "テンタクルバイト",
        "deck_counts": [2, 2, 2, 1, 2, 1, 2, 1, 2, 0, 2, 2, 2],
        "median": 2,
        "average": 1.6,
        "count_3": 0,
        "count_2": 9,
        "count_1": 3,
        "count_0": 1
    }
]

app = Flask(__name__)


class Card:
    def __init__(self, name, weighted_average, variance):
        self.name = name
        self.weighted_average = weighted_average
        self.variance = variance
        self.std_dev = math.sqrt(variance)
        self.rounded_average = int(round(weighted_average, 0))
        self.delta = weighted_average - self.rounded_average
        self.adjusted_count = self.rounded_average
        self.removability_score = 0
        self.addability_score = 0

    def to_dict(self):
        return {
            "name": self.name,
            "average": f"{self.weighted_average:.2f}",
            "variance": f"{self.variance:.2f}",
            "std_dev": f"{self.std_dev:.2f}",
            "rounded_average": f"{self.rounded_average}",
            "delta": f"{self.delta:.2f}",
            "adjusted_count": f"{self.adjusted_count}",
            "removability_score": f"{self.removability_score:.4f}" if self.removability_score != np.inf else "INF",
            "addability_score": f"{self.addability_score:.4f}" if self.addability_score != np.inf else "INF"
        }

def select_replacement_candidates(cards):
    v_avg = np.array([card.weighted_average for card in cards])
    v_std_dev = np.array([card.std_dev for card in cards])
    v_final = np.array([card.adjusted_count for card in cards])
    epsilon = 1e-6

    # Calculate removability scores
    for i, card in enumerate(cards):
        if card.adjusted_count > 0:
            v_temp = v_final.copy()
            v_temp[i] -= 1
            v_temp_delta = v_temp - v_avg
            penalty = np.sum(((v_temp_delta / (v_std_dev + epsilon)) ** 2))
            card.removability_score = 1 / penalty if penalty != 0 else np.inf

    # Calculate addability scores
    for i, card in enumerate(cards):
        if card.adjusted_count < 3:
            v_temp = v_final.copy()
            v_temp[i] += 1
            v_temp_delta = v_temp - v_avg
            penalty = np.sum(((v_temp_delta / (v_std_dev + epsilon)) ** 2))
            card.addability_score = 1 / penalty if penalty != 0 else np.inf


def get_driver():
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    return driver

def get_deck_names():
    driver = get_driver()
    url = "https://svlabo.jp/blog-entry-1467.html"
    driver.get(url)
    time.sleep(5)  # Wait for the page to load and JavaScript to execute
    deck_select_element = driver.find_element(By.ID, "deckname_select_elm")
    select_obj = Select(deck_select_element)
    options = [option.text for option in select_obj.options]
    driver.quit()
    return options

def scrape_card_data(deck_name):
    driver = get_driver()
    url = "https://svlabo.jp/blog-entry-1467.html"
    driver.get(url)
    time.sleep(5)  # Wait for the page to load and JavaScript to execute
    deck_select_element = driver.find_element(By.ID, "deckname_select_elm")
    select_obj = Select(deck_select_element)
    select_obj.select_by_visible_text(deck_name)
    time.sleep(3)  # Wait for the data to update after selection
    html = driver.page_source
    driver.quit()
    return BeautifulSoup(html, 'html.parser')

def calculate_initial_analysis(soup):
    table_head = soup.select_one("#table_header")
    all_headers = table_head.find_all("th")
    rating_tags = all_headers[6:-4]
    rating_int_list = [int(tag.text) if tag.text.strip().isdigit() else 1650 for tag in rating_tags]
    weights_list = [(rating - 1600) / 100 for rating in rating_int_list]
    total_weight = sum(weights_list)

    building = soup.select_one("#decklist_body")
    all_rows = building.find_all("tr")
    print(f"--- [WEB] 크롤링 완료: 총 {len(all_rows)}개의 카드 정보를 찾았습니다. ---")

    cards = []
    for row in all_rows:
        card_name_tag = row.find("div")
        if not card_name_tag:
            break
        card_name_text = card_name_tag.text
        cells_in_row = row.find_all("td")
        numbers_int_list = [int(cell.text) for cell in cells_in_row[1:-6]]
        numerator = sum(count * weight for count, weight in zip(numbers_int_list, weights_list))
        weighted_average = numerator / total_weight
        
        # Calculate weighted variance
        weighted_variance = sum(w * ((x - weighted_average) ** 2) for x, w in zip(numbers_int_list, weights_list)) / total_weight
        
        cards.append(Card(card_name_text, weighted_average, weighted_variance))
    return cards

def adjust_deck_count(cards):
    v_avg = np.array([card.weighted_average for card in cards])
    v_std_dev = np.array([card.std_dev for card in cards])
    v_current = np.array([card.rounded_average for card in cards])

    cards_to_adjust = sum(v_current) - 40
    epsilon = 1e-6  # To avoid division by zero

    # Loop until the deck has 40 cards
    while cards_to_adjust != 0:
        best_card_index = -1
        min_penalty = np.inf

        # Determine if we are adding or removing cards
        adjustment = -1 if cards_to_adjust > 0 else 1

        # Find the best card to adjust
        for i, card in enumerate(cards):
            # Check if the adjustment is possible
            if (adjustment == -1 and v_current[i] > 0) or (adjustment == 1 and v_current[i] < 3):
                v_temp = v_current.copy()
                v_temp[i] += adjustment
                
                v_temp_delta = v_temp - v_avg
                
                # Calculate penalty
                penalty = np.sum(((v_temp_delta / (v_std_dev + epsilon)) ** 2))

                if penalty < min_penalty:
                    min_penalty = penalty
                    best_card_index = i

        # Apply the best adjustment found
        if best_card_index != -1:
            v_current[best_card_index] += adjustment
            cards[best_card_index].adjusted_count += adjustment
            cards_to_adjust += adjustment
        else:
            # Should not happen if there are valid cards to adjust
            break

def select_replacement_candidates(cards):
    v_avg = np.array([card.weighted_average for card in cards])
    v_std_dev = np.array([card.std_dev for card in cards])
    v_final = np.array([card.adjusted_count for card in cards])
    epsilon = 1e-6

    # Calculate removability scores
    for i, card in enumerate(cards):
        if card.adjusted_count > 0:
            v_temp = v_final.copy()
            v_temp[i] -= 1
            v_temp_delta = v_temp - v_avg
            penalty = np.sum(((v_temp_delta / (v_std_dev + epsilon)) ** 2))
            card.removability_score = 1 / penalty

    # Calculate addability scores
    for i, card in enumerate(cards):
        if card.adjusted_count < 3:
            v_temp = v_final.copy()
            v_temp[i] += 1
            v_temp_delta = v_temp - v_avg
            penalty = np.sum(((v_temp_delta / (v_std_dev + epsilon)) ** 2))
            card.addability_score = 1 / penalty

def analyze_live_data(deck_name):
    soup = scrape_card_data(deck_name)
    cards = calculate_initial_analysis(soup)
    round_sum = sum(card.rounded_average for card in cards)
    adjust_deck_count(cards)
    select_replacement_candidates(cards)

    analysis_results = [card.to_dict() for card in cards]
    analysis_results.append({
        "name": "총 합",
        "average": "40",
        "variance": "N/A",
        "std_dev": "N/A",
        "rounded_average": f"{round_sum}",
        "delta": "40",
        "adjusted_count": "40",
        "removability_score": "N/A",
        "addability_score": "N/A"
    })
    return analysis_results

@app.route("/")
def index():
    deck_names = get_deck_names()
    if not deck_names:
        return "덱 이름을 가져오지 못했습니다.", 500
    
    default_deck_name = deck_names[0]
    initial_data = analyze_live_data(default_deck_name)
    
    if not initial_data:
        return "초기 데이터를 로드하지 못했습니다.", 500
        
    return render_template("index.html", deck_names=deck_names, results=initial_data, selected_deck=default_deck_name)

@app.route("/get_deck_analysis/<deck_name>")
def get_deck_analysis(deck_name):
    analysis_results = analyze_live_data(deck_name)
    if not analysis_results:
        return jsonify({"error": "데이터 로딩에 실패했거나 데이터가 없습니다."}), 500
    return jsonify(analysis_results)


if __name__ == '__main__':
    app.run(debug=True)