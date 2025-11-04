let dckl_elm;
let dckl_fin={};

function create_decklist(allTweets) {
    
    // カードIDと名前
    const card_id_to_index = {};
    const card_id_to_name = {};
    const card_id_match_map = {};

    for (let i = 0; i < cardids.length; i++) {
        card_id_to_index[cardids[i]] = i;
        card_id_to_name[cardids[i]] = cardnms[i];
        card_id_match_map[cardids[i]] = new Set(cardids[i].split('.'));
    }

    // ソート：連勝数、使用日付（降順）
    allTweets.sort((a, b) => {
        // まず数値化
        const rawRateA = parseInt(a.rating);
        const rawRateB = parseInt(b.rating);

        // 両方0ならnullに、それ以外はそのまま
        const rateA = (rawRateA === 0 && rawRateB === 0) ? null : rawRateA;
        const rateB = (rawRateA === 0 && rawRateB === 0) ? null : rawRateB;
        if (rateA != null && rateB != null) {
            if (rateA !== rateB) return rateB - rateA;
        } else {
            const renA = a.ren_count != null ? parseInt(a.ren_count) : null;
            const renB = b.ren_count != null ? parseInt(b.ren_count) : null;

            if (renA != null && renB != null) {
                if (renA !== renB) return renB - renA;
            } else if (renA != null || renB != null) {
                return renB != null ? 1 : -1;
            } else {
                // posの昇順。ただし0は最下位にする
                if (a.pos != null && b.pos != null) {
                    const posA = (a.pos === 0) ? Infinity : a.pos;
                    const posB = (b.pos === 0) ? Infinity : b.pos;
                    if (posA !== posB) return posA - posB;
                }
            }
        }

        // 最後に日付の降順
        return new Date(b.tweet_datetime_str) - new Date(a.tweet_datetime_str);
    });


    const tables = {};

    allTweets.forEach(row => {
        if (!row.deck_code)return;
        const deck = row.deck_name;
        const dcodes = row.deck_code.split(',');

        if (!tables[deck]) tables[deck] = {};

        dcodes.forEach(card_str => {
            const card_list = card_str.includes('.') ? card_str.split('.').slice(1) : [];
            const counts = {};

            // カウント
            card_list.forEach(id => {
                counts[id] = (counts[id] || 0) + 1;
            });

            const column = Array(cardids.length).fill(0);

            for (const raw_card_id in card_id_match_map) {
                let match_count = 0;
                for (const id of card_id_match_map[raw_card_id]) {
                    if (counts[id]) match_count += counts[id];
                }
                if (match_count > 0) {
                    const idx = card_id_to_index[raw_card_id];
                    column[idx] = match_count;
                }
            }

            if (column.reduce((a, b) => a + b, 0) === 40) {
                column.forEach((count, idx) => {
                    const cid = cardids[idx];  // df_cards の代わりに cardids[idx] で代用
                    if (!tables[deck][cid]) tables[deck][cid] = [];
                    tables[deck][cid].push(count);
                });

                if ('rank_no' in row) {
                    tables[deck]['ランク'] = tables[deck]['ランク'] || [];
                    tables[deck]['ランク'].push(row.rank_no);
                }

                if ('group_no' in row) {
                    tables[deck]['グループ'] = tables[deck]['グループ'] || [];
                    tables[deck]['グループ'].push(row.group_no);
                }

                if ('tmatch' in row) {
                    tables[deck]['元ポスト'] = tables[deck]['元ポスト'] || [];
                    tables[deck]['元ポスト'].push(row.tmatch);
                }

                if ('ren_count' in row) {
                    tables[deck]['連勝数'] = tables[deck]['連勝数'] || [];
                    tables[deck]['連勝数'].push(row.ren_count);
                }
                
                if ('tweet_datetime_str' in row) {
                    tables[deck]['使用日'] = tables[deck]['使用日'] || [];
                    const dateStr = row.tweet_datetime_str?.slice(2, 10).replace(/-/g, '');
                    tables[deck]['使用日'].push(dateStr);
                }

                if ('name' in row) {
                    tables[deck]['選手'] = tables[deck]['選手'] || [];
                    tables[deck]['選手'].push(row.name);
                }

                if ('team' in row) {
                    tables[deck]['チーム'] = tables[deck]['チーム'] || [];
                    tables[deck]['チーム'].push(row.team);
                }

                if ('timg' in row) {
                    tables[deck]['timg'] = tables[deck]['timg'] || [];
                    tables[deck]['timg'].push(row.timg);
                }

                if ('pos' in row) {
                    tables[deck]['順位'] = tables[deck]['順位'] || [];
                    tables[deck]['順位'].push(row.pos);
                }
                if ('rating' in row) {
                    tables[deck]['レート'] = tables[deck]['レート'] || [];
                    tables[deck]['レート'].push(row.rating);
                }

            }
        });
    });

    // 出現数でソート
    const keyA = Object.keys(tables[Object.keys(tables)[0]])[0];
    const decks = Object.keys(tables).sort((a, b) => {
        const lenA = (tables[a][keyA] || []).length;
        const lenB = (tables[b][keyA] || []).length;
        return lenB - lenA;
    });

    // フィルタ処理
    const filtered_tables = {};

    decks.forEach(deck => {
        const table = tables[deck];
        const filtered = {};

        for (const key in table) {
            if (
                key === "順位" ||                      // 「順位」は常に含める
                table[key].some(val => val !== 0)     // その他のキーは0以外が含まれていれば含める
            ) {
                filtered[key] = table[key];
            }
        }

        filtered_tables[deck] = filtered;
    });

    return filtered_tables;
}


if (typeof tour_info_fin !== "undefined") {
    allTweets = tour_info_fin.flatMap(info =>
        info.deck.map(deckItem => {
            const { deck, ...infoWithoutDeck } = info; // deckを除外
            const merged = { ...infoWithoutDeck, ...deckItem };
            return Object.fromEntries(
                Object.entries(merged).filter(([_, v]) => v !== undefined)
            );
        })
    );
    dckl_fin=create_decklist(allTweets);
}

if (typeof tour_info !== "undefined") {
    allTweets = tour_info.flatMap(info =>
        info.deck.map(deckItem => {
            const { deck, ...infoWithoutDeck } = info; // deckを除外
            const merged = { ...infoWithoutDeck, ...deckItem };
            return Object.fromEntries(
                Object.entries(merged).filter(([_, v]) => v !== undefined)
            );
        })
    );
}

dckl_elm=create_decklist(allTweets);