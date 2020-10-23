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

        // 連続してツイートボタンが押されるのを防ぐフラグ
        let isClickedTweetButton = false;

        // 監視ターゲットの取得
        const observeItem = document.querySelector('div#layers');
        const observeItem_sp = document.querySelector('div[data-at-shortcutkeys]');  // スマホ画面用

        // オブザーバーの作成
        function observe(records) {

            for (record of records) {

                // 100ミリ秒後に実行
                // モーダルが開くまで少しだけ待つ
                setTimeout(function() {

                    // 右クリックからは除外
                    if (isRightClick) {
                        isRightClick = false; // フラグを降ろす
                        return;
                    }

                    // モーダルがリツイート状態か
                    // TODO: 最初にうまくいかないのは isRetweet が false になるから
                    const isRetweet = (
                        record['target'].querySelector('div[data-testid="attachments"] > div > div > span') &&
                        record['target'].querySelector('div[data-testid="attachments"] > div > div > span').textContent &&
                        record['target'].querySelector('div[data-testid="attachments"] > div > div > span').textContent === '引用ツイート'
                    );

                    //　ツイートボタンを取得
                    const tweetButton = record['target'].querySelector('div[data-testid="tweetButton"]');

                    // モーダルがリツイート状態 & フラグがオフ
                    if (isRetweet && isClickedTweetButton === false) {

                        console.log('モーダルがリツイート状態 & フラグがオフ')

                        // ツイートボタンがが存在する & 無効化されていない
                        if (tweetButton !== null && tweetButton.getAttribute('disabled') === null) {

                            console.log('ツイート')

                            // ツイートボタンをクリック
                            tweetButton.click();

                            // フラグ管理
                            isClickedTweetButton = true;
                            setTimeout(function() {
                                isClickedTweetButton = false;
                            }, 1000);  // 1秒後にオフ

                        }
                    }

                }, 100);
            }
        }

        const observer = new MutationObserver(observe);
        const observer_sp = new MutationObserver(observe);

        // 監視の開始
        observer.observe(observeItem, {
            childList: true,  // 子要素を監視
        });
        observer_sp.observe(observeItem_sp, {
            childList: true,  // 子要素を監視
        });

    }, 1000);
}