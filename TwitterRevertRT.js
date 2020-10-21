window.onload = function() {

    // 1秒後に実行
    // 間を空けないと要素がまだ生成されてないのでエラーになる
    setTimeout(function() {

        // コンテキストメニューのイベント
        let isRightClick = false
        document.addEventListener('contextmenu', function(event) {

            // クリックされた子要素から親要素に向かって巡っていく
            for (element of event.composedPath()) {

                // リツイートボタン（ data-testid が retweet の要素）があれば
                if (element.dataset && element.dataset.testid && element.dataset.testid === 'retweet') {

                    // 通常の右クリックを無効化
                    event.preventDefault();

                    // フラグを立てる
                    isRightClick = true;

                    // リツイート画面を表示（リツイートボタンをクリック）
                    element.click();
                }
            }
        });

        // 監視ターゲットの取得
        const observeItem = document.querySelector('div#layers');

        // オブザーバーの作成
        const observer = new MutationObserver(records => {

            for (record of records) {

                console.log(record['target'])

                // 100ミリ秒後に実行
                // モーダルが開くまで少しだけ待つ
                setTimeout(function() {

                    //　ツイートボタンを取得
                    const tweetButton = record['target'].querySelector('div[data-testid="tweetButton"]');

                    console.log(isRightClick)
                    console.log(tweetButton)

                    // 右クリックからは除外
                    if (isRightClick) {
                        isRightClick = false; // フラグを降ろす
                        console.log('右クリックなので引用ツイート')
                        return;
                    }

                    // ツイートボタンがが存在する & 無効化されていない
                    if (tweetButton !== null && tweetButton.getAttribute('disabled') === null) {

                        // モーダルがリツイート状態か
                        const isRetweet = (
                            record['target'].querySelector('div[data-testid="attachments"] > div > div > span') &&
                            record['target'].querySelector('div[data-testid="attachments"] > div > div > span').textContent &&
                            record['target'].querySelector('div[data-testid="attachments"] > div > div > span').textContent === '引用ツイート'
                        );

                        console.log(isRetweet)

                        // モーダルがリツイート状態
                        if (isRetweet) {

                            console.log('リツイート')

                            // ツイートボタンをクリック
                            tweetButton.click();
                        }
                    }

                }, 100);
            }
        });

        // 監視の開始
        observer.observe(observeItem, {
            childList: true,  // 子要素を監視
        });

    }, 1000);
}