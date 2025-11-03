import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)
url = "https://svlabo.jp/blog-entry-1467.html"
driver.get(url)

time.sleep(5)

html = driver.page_source
driver.quit() # 브라우저 종료

soup = BeautifulSoup(html, 'html.parser')
building = soup.select_one("#decklist_body")
all_rows = building.find_all("tr")
for row in all_rows:
    card_name_tag = row.find("div")
    if card_name_tag:
        card_name_text = card_name_tag.text

        cells_in_row = row.find_all("td")
        numbers_str_list = [cell.text for cell in cells_in_row[1:14]]
        numbers_int_list = [int(n) for n in numbers_str_list]

        average = sum(numbers_int_list) / len(numbers_int_list)
        if average > 2.72:
            print(f"{card_name_text} -> 고정칸 (평균:{average})")
        elif average < 0.28:
            print(f"{card_name_text} -> 제외칸 (평균:{average})")
        else:
            print(f"{card_name_text} -> 선택칸 (평균:{average})")
    else:
        break