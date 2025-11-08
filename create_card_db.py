# create_card_db.py
import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

def scrape_page(driver, database):
    """현재 페이지의 모든 카드 정보를 스크래핑하여 데이터베이스에 추가 (지연 로딩 처리)"""
    try:
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "li.card-wrapper[data-card_id]")))
        card_elements = driver.find_elements(By.CSS_SELECTOR, "li.card-wrapper[data-card_id]")
        
        if not card_elements:
            return False

        for card_element in card_elements:
            # 지연 로딩을 트리거하기 위해 요소를 뷰로 스크롤
            driver.execute_script("arguments[0].scrollIntoView(true);", card_element)
            time.sleep(0.05) # 이미지가 로드될 시간을 아주 약간 줌

            card_id = card_element.get_attribute('data-card_id')
            card_name = ""
            try:
                # Selenium을 통해 직접 alt 속성 값 가져오기
                img_element = card_element.find_element(By.CSS_SELECTOR, "img.card-img[alt]")
                card_name = img_element.get_attribute('alt').strip()
            except Exception:
                # alt 속성이 없는 경우를 대비
                continue

            if card_id and card_name and card_name not in database:
                database[card_name] = card_id
        return True
    except Exception as e:
        print(f"   -> 페이지 스크래핑 중 오류: {e}")
        return False

def create_database():
    print("--- 카드 데이터베이스 구축 시작 (지연 로딩 처리) ---")
    driver = None
    try:
        options = webdriver.ChromeOptions()
        options.add_experimental_option('prefs', {'intl.accept_languages': 'ja-JP,ja'})
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        driver.set_window_size(1920, 1080)
        
        print("1. 덱 포탈 메인 페이지로 이동...")
        driver.get("https://shadowverse-wb.com/ja/deck/")
        
        print("2. 쿠키 동의 바 처리...")
        try:
            accept_button = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler")))
            accept_button.click()
            WebDriverWait(driver, 10).until(EC.invisibility_of_element_located((By.ID, "onetrust-banner-sdk")))
            print("   -> 쿠키 동의 완료.")
        except Exception:
            print("   -> 쿠키 동의 바 없음.")

        print("3. 본문의 '카드 일람' 버튼 클릭...")
        card_list_button = WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "a.button.icon-cards[href='/ja/deck/cardslist/']"))
        )
        driver.execute_script("arguments[0].click();", card_list_button)

        print("4. 카드 리스트 페이지 로딩 및 전체 페이지 수 확인...")
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, "a.pager-item-inner[data-page-id]")))
        page_elements = driver.find_elements(By.CSS_SELECTOR, "a.pager-item-inner[data-page-id]")
        total_pages = int(page_elements[-1].get_attribute("data-page-id"))
        print(f"   -> 로딩 완료. 총 {total_pages} 페이지 확인.")

        print("5. 모든 페이지를 순회하며 데이터 수집...")
        card_database = {}
        
        for page_num in range(1, total_pages + 1):
            print(f"   -> {page_num} 페이지 분석 중...")
            if page_num > 1:
                try:
                    page_button = WebDriverWait(driver, 15).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, f"a.pager-item-inner[data-page-id='{page_num}']"))
                    )
                    driver.execute_script("arguments[0].click();", page_button)
                    WebDriverWait(driver, 20).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, f".pager-item.active a[data-page-id='{page_num}']"))
                    )
                except Exception as e:
                    print(f"   -> {page_num} 페이지로 이동 중 오류 발생: {e}. 재시도...")
                    driver.refresh()
                    time.sleep(3)
                    continue

            if not scrape_page(driver, card_database):
                print(f"   -> {page_num} 페이지에서 카드 정보를 찾을 수 없어 중단합니다.")
                break
        
        if not card_database:
            print("\n오류: 카드 데이터를 수집하지 못했습니다.")
            return

        with open("card_database.json", "w", encoding="utf-8") as f:
            json.dump(card_database, f, ensure_ascii=False, indent=4)
            
        print(f"\n성공: 데이터베이스 생성 완료. 총 {len(card_database)}개의 카드를 'card_database.json'에 저장했습니다.")

    finally:
        if driver:
            print("\n--- 드라이버 종료 ---")
            driver.quit()

if __name__ == "__main__":
    create_database()