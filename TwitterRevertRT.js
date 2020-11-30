window.onload = function() {

    // 0.5秒後に実行
    // 間を空けないと要素がまだ生成されてないのでエラーになる
    setTimeout(function() {

        // メニューの位置を取得する
        function getPosition(retweetButton, isGalleryMode) {

            // メニューの位置
            const position_height = 98;
            const boundingClientRect = retweetButton.getBoundingClientRect();
            const scrollbarWidth = (isGalleryMode ? 0 : getScrollbarWidth());
            let position_top = Math.round(boundingClientRect.top + window.pageYOffset);
            let position_right = Math.round(document.documentElement.clientWidth - boundingClientRect.right + scrollbarWidth);

            // ウインドウからはみ出ないように
            let isLowerEdge = false;
            if (position_top > ((window.pageYOffset + document.documentElement.clientHeight) - position_height)) {
                position_top = position_top + boundingClientRect.height - position_height;
                isLowerEdge = true;
            }

            return [position_top, position_right, isLowerEdge];
        }

        // スクロールバーの幅を取得する
        // 参考: https://exiz.org/posts/javascript-scrollbar-width/
        function getScrollbarWidth() {
            let element = document.createElement('div');
            element.style.visibility = 'hidden';
            element.style.overflow = 'scroll';
            document.body.appendChild(element);
            const scrollbarWidth = element.offsetWidth - element.clientWidth;
            document.body.removeChild(element);
            return scrollbarWidth;
        }

        // リツイートボタンがクリックされたときのイベントハンドラ (PC用)
        function TwitterRevertRT(event, isGalleryMode) {

            // テーマの背景の色を取得
            const theme_background = getComputedStyle(document.body).backgroundColor;

            // テーマのテキストの色を取得
            const theme_color = (function(theme_background) {
                switch (theme_background) {
                    case 'rgb(255, 255, 255)':
                        return 'rgb(15, 20, 25)';
                    case 'rgb(21, 32, 43)':
                        return 'rgb(255, 255, 255)';
                    case 'rgb(0, 0, 0)':
                        return 'rgb(217, 217, 217)';
                }
            }(theme_background));

            // テーマの boxshadow の色
            const theme_boxshadow = (function(theme_background) {
                switch (theme_background) {
                    case 'rgb(255, 255, 255)':
                        return 'rgba(101, 119, 134, 0.2)';
                    case 'rgb(21, 32, 43)':
                        return 'rgba(136, 153, 166, 0.2)';
                    case 'rgb(0, 0, 0)':
                        return 'rgba(255, 255, 255, 0.2)';
                }
            }(theme_background));

            // リツイートボタン
            let retweetButton = null;

            // 細画面かどうか
            let isThinWindow = window.innerWidth <= 704;  // 横幅が 704px 以下

            // クリックされた子要素から親要素に向かって巡っていく
            for (element of event.composedPath()) {

                // data-testid が retweet
                if (element.dataset && element.dataset.testid && element.dataset.testid === 'retweet') {

                    // 要素を取得
                    retweetButton = element;
                }
            }

            // 実際にリツイートボタンのときだけ
            if (retweetButton !== null) {
                
                // 最初にスクロール位置を保存
                const scrolltop = document.documentElement.scrollTop;

                // 位置を取得
                let [position_top, position_right, isLowerEdge] = getPosition(retweetButton, isGalleryMode);

                // スタイル配置
                document.querySelector('body').insertAdjacentHTML('beforeend', `
                    <style class="revertrt-style-hide">
                        /* モーダルが一瞬だけ表示されることがないよう CSS 側で隠す */
                        div#layers > div:nth-child(2) {
                            opacity: 0;
                        }
                        @media screen and (max-width: 704px) {
                            div[data-at-shortcutkeys] > main[role="main"]:not(.revertrt-clone-main) {
                                display: none;
                            }
                        }
                    </style>
                `);

                // 細画面の場合、main 要素が書き換えられてツイート画面になってしまうため、
                // 書き換えられる前の header 要素以下と main 要素以下を複製して一時的に再配置する
                if (isThinWindow) {

                    // 要素を複製
                    let header = document.querySelector('header[role="banner"]');
                    if (header !== null) {
                        header.insertAdjacentElement('afterend', header.cloneNode(true));
                    }
                    let main = document.querySelector('main[role="main"]');
                    main.insertAdjacentElement('afterend', main.cloneNode(true));
                    
                    // 識別できるようにクラスを付与
                    let header2 = document.querySelectorAll('header[role="banner"]')[1];
                    if (header2 !== undefined && header2 !== null) {
                        header2.classList.add('revertrt-clone-header');
                    }
                    let main2 = document.querySelectorAll('main[role="main"]')[1];
                    if (main2 !== undefined && main2 !== null) {
                        main2.classList.add('revertrt-clone-main');
                    }

                    // スクロール量を復元
                    setTimeout(function() {
                        document.documentElement.scrollTop = scrolltop;
                    }, 50);

                    // ギャラリーモード時
                    if (isGalleryMode) {
                        document.querySelectorAll('main[role="main"]')[0].style.display = 'none';
                        document.querySelectorAll('main[role="main"]')[1].style.display = 'flex';
                    }
                }

                // ギャラリーモード&細画面でない
                // こちらもツイートフォームのレイヤーが書き換えられてしまうため一時的に再配置
                if (isGalleryMode && isThinWindow === false) {
                    document.querySelectorAll('div#layers > div')[1].insertAdjacentElement('afterend',
                        document.querySelectorAll('div#layers > div')[1].cloneNode(true));
                    // 識別できるよう専用のクラスを付与
                    document.querySelectorAll('div#layers > div')[2].classList.add('revertrt-clone-gallery');
                }

                // モーダルを一旦隠す
                // 若干時間を空けないと実行できない
                let interval = setInterval(function() {
                    if (document.querySelector('div[aria-labelledby="modal-header"]') !== null) {
                        clearInterval(interval);
                    }
                }, 10);

                // メニューを表示
                document.querySelector('body').insertAdjacentHTML('beforeend', `
                    <style class="revertrt-style">
                        .revertrt-menu {
                            position: absolute;
                            width: 150px;
                            height: 0px;
                            border-radius: 4px;
                            background-color: ${theme_background};
                            color: ${theme_color};
                            box-shadow: ${theme_boxshadow} 0px 0px 15px, rgba(101, 119, 134, 0.15) 0px 0px 3px 1px;
                            overflow: hidden;
                            transition: height 0.1s ease;
                            z-index: 1000;
                        }
                        .revertrt-menuitem {
                            display: flex;
                            flex-direction: row;
                            align-items: center;
                            padding: 15px;
                            transition-property: background-color, box-shadow;
                            transition-duration: 0.2s;
                            user-select: none;
                            -webkit-user-select: none;
                            outline-style: none;
                            cursor: pointer;
                        }
                        .revertrt-menuitem:hover {
                            background-color: rgba(0, 0, 0, 0.03);
                        }
                        .revertrt-menuitem-icon {
                            color: rgb(91, 112, 131);
                            height: 1.25em;
                            fill: currentcolor;
                            margin-right: 10px;
                            vertical-align: text-bottom;
                        }
                        .revertrt-menuitem-text {
                            font-size: 15px;
                            font-family: "Segoe UI", Meiryo, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
                            overflow-wrap: break-word;
                            line-height: 1.3125;
                        }
                    </style>
                    <div class="revertrt-cover" style="position: fixed; top: 0px; left: 0px; right: 0px; bottom: 0px; z-index: 999;"></div>
                    <div class="revertrt-menu" style="top: ${position_top}px; right: ${position_right}px;">
                        <div class="revertrt-menuitem revertrt-retweet" data-focusable="true" tabindex="0">
                            <svg viewBox="0 0 24 24" class="revertrt-menuitem-icon"><g><path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"></path></g></svg>
                            <div class="revertrt-menuitem-text">リツイート</div>
                        </div>
                        <div class="revertrt-menuitem revertrt-quotetweet" data-focusable="true" tabindex="0">
                            <svg viewBox="0 0 24 24" class="revertrt-menuitem-icon"><g><path d="M22.132 7.653c0-.6-.234-1.166-.66-1.59l-3.535-3.536c-.85-.85-2.333-.85-3.182 0L3.417 13.865c-.323.323-.538.732-.63 1.25l-.534 5.816c-.02.223.06.442.217.6.14.142.332.22.53.22.023 0 .046 0 .068-.003l5.884-.544c.45-.082.86-.297 1.184-.62l11.337-11.34c.425-.424.66-.99.66-1.59zm-17.954 8.69l3.476 3.476-3.825.35.348-3.826zm5.628 2.447c-.282.283-.777.284-1.06 0L5.21 15.255c-.292-.292-.292-.77 0-1.06l8.398-8.398 4.596 4.596-8.398 8.397zM20.413 8.184l-1.15 1.15-4.595-4.597 1.15-1.15c.14-.14.33-.22.53-.22s.388.08.53.22l3.535 3.536c.142.142.22.33.22.53s-.08.39-.22.53z"></path></g></svg>
                            <div class="revertrt-menuitem-text">引用ツイート</div>
                        </div>
                    </div>
                `);

                // 要素を取得
                let revertrt_style_hide = document.querySelector('.revertrt-style-hide');
                let revertrt_style = document.querySelector('.revertrt-style');
                let revertrt_cover = document.querySelector('.revertrt-cover');
                let revertrt_menu = document.querySelector('.revertrt-menu');

                // 高さをアニメーション
                if (isLowerEdge) {  // ギャラリーモード時は意図的にアニメーションを無効化
                    if (revertrt_menu !== null) {
                        revertrt_menu.style.height = '98px';
                    }
                }
                setTimeout(function() {  // 少しだけ遅らせないと効かない
                    if (revertrt_menu !== null) {
                        revertrt_menu.style.height = '98px';
                    }
                }, 10);

                // カバークリック時
                revertrt_cover.addEventListener('click', function() {

                    // 細画面時
                    if (isThinWindow) {

                        // ツイートフォームを削除
                        document.querySelector('main[role="main"] > div > div > div:nth-child(2) > div > div > div > div > div[aria-label][role="button"]').click();

                        // 細画面でギャラリーモードなら先に消しちゃう
                        if (isGalleryMode) {
                            if (revertrt_style_hide !== null) {
                                revertrt_style_hide.remove();
                            }
                        }

                        // 複製部分を削除
                        setTimeout(function() {
                            let revertrt_clone_header = document.querySelector('header.revertrt-clone-header');
                            if (revertrt_clone_header !== null) {
                                revertrt_clone_header.remove();
                            }
                            let revertrt_clone_main = document.querySelector('main.revertrt-clone-main');
                            if (revertrt_clone_main !== null) {
                                revertrt_clone_main.remove();
                            }
                            if (isGalleryMode) {  // ギャラリーモード時
                                document.querySelector('main[role="main"]').style.display = '';
                            }
                        }, 100);

                        let count = 1;
                        let interval = setInterval(function() {
                            if (count > 12) {
                                clearInterval(interval);
                            }
                            // スクロール量を復元
                            document.documentElement.scrollTop = scrolltop;
                            count++;
                        }, 50);
                        
                    } else {

                        // モーダルを削除
                        let aria_labelledby_modal_header = document.querySelector('div[aria-labelledby="modal-header"]');
                        if (aria_labelledby_modal_header !== null &&
                            aria_labelledby_modal_header.previousElementSibling !== null) {
                            aria_labelledby_modal_header.previousElementSibling.click();
                        }
                    }

                    // メニューを削除
                    if (revertrt_style !== null) {
                        revertrt_style.remove();
                    }
                    if (revertrt_menu !== null) {
                        revertrt_menu.remove();
                    }

                    // カバーを削除
                    if (revertrt_cover !== null) {
                        revertrt_cover.remove();
                    }

                    // モーダルを再表示
                    setTimeout(function() {
                        if (isGalleryMode && isThinWindow === false) {
                            let revertrt_clone_gallery = document.querySelector('div#layers > div.revertrt-clone-gallery');
                            if (revertrt_clone_gallery !== null) {
                                revertrt_clone_gallery.remove();
                            }
                        }
                        if (revertrt_style_hide !== null) {
                            revertrt_style_hide.remove();
                        }
                    }, 500);
                });

                // 「リツイート」ボタンクリック時
                document.querySelector('.revertrt-retweet').addEventListener('click', function() {

                    // 細画面時
                    if (isThinWindow) {

                        // ツイートボタンをクリック
                        document.querySelector('main[role="main"] div[data-testid="tweetButton"]').click();

                        let count = 1;
                        let interval = setInterval(function() {
                            if (count > 20) {
                                clearInterval(interval);
                            }
                            // スクロール量を復元
                            document.documentElement.scrollTop = scrolltop;
                            count++;
                        }, 50);
                        
                    } else {

                        // ツイートボタンをクリック
                        document.querySelector('div[aria-labelledby="modal-header"] div[data-testid="tweetButton"]').click();
                    }

                    // メニューを削除
                    if (revertrt_style !== null) {
                        revertrt_style.remove();
                    }
                    if (revertrt_menu !== null) {
                        revertrt_menu.remove();
                    }

                    // カバーを削除
                    if (revertrt_cover !== null) {
                        revertrt_cover.remove();
                    }

                    // モーダルを再表示
                    setTimeout(function() {
                        if (isThinWindow) {  // 複製部分を削除
                            let revertrt_clone_header = document.querySelector('header.revertrt-clone-header');
                            if (revertrt_clone_header !== null) {
                                revertrt_clone_header.remove();
                            }
                            let revertrt_clone_main = document.querySelector('main.revertrt-clone-main');
                            if (revertrt_clone_main !== null) {
                                revertrt_clone_main.remove();
                            }
                            if (isGalleryMode) {  // ギャラリーモード時
                                document.querySelector('main[role="main"]').style.display = '';
                            }
                            document.documentElement.scrollTop = scrolltop;
                        }
                        if (isGalleryMode && isThinWindow === false) {
                            let revertrt_clone_gallery = document.querySelector('div#layers > div.revertrt-clone-gallery');
                            if (revertrt_clone_gallery !== null) {
                                revertrt_clone_gallery.remove();
                            }
                        }
                        if (revertrt_style_hide !== null) {
                            revertrt_style_hide.remove();
                        }
                    }, 500);
                });

                // 「引用ツイート」ボタンクリック時
                document.querySelector('.revertrt-quotetweet').addEventListener('click', function() {

                    if (isThinWindow) {
                        // 複製した要素を削除
                        let revertrt_clone_header = document.querySelector('header.revertrt-clone-header');
                        if (revertrt_clone_header !== null) {
                            revertrt_clone_header.remove();
                        }
                        let revertrt_clone_main = document.querySelector('main.revertrt-clone-main');
                        if (revertrt_clone_main !== null) {
                            revertrt_clone_main.remove();
                        }
                        if (isGalleryMode) {  // ギャラリーモード時
                            document.querySelector('main[role="main"]').style.display = '';
                        }
                    }

                    // モーダルを開く
                    revertrt_style_hide.remove();

                    // メニューを削除
                    if (isGalleryMode && isThinWindow === false) {
                        let revertrt_clone_gallery = document.querySelector('div#layers > div.revertrt-clone-gallery');
                        if (revertrt_clone_gallery !== null) {
                            revertrt_clone_gallery.remove();
                        }
                    }
                    revertrt_style.remove();
                    revertrt_menu.remove();
                    revertrt_cover.remove();
                });

            }
        }
        
        // 0.5秒間隔で監視し続ける
        setInterval(function() {

            // 見つかったリツイートボタンに手当たり次第イベントを追加していく
            document.querySelectorAll('div[data-testid=retweet]').forEach(function(element) {

                // ギャラリーモードかどうか
                const isGalleryMode = (function(element) {
                    let modal_header = element.closest('div[aria-labelledby="modal-header"]');
                    if (modal_header !== null) {
                        // 呪文（限界度MAX）
                        // リツイートボタンの親に modal-header があり、さらにそのひ孫要素のスタイルの transitionProperty が 'background-color' か
                        return element.closest('div[aria-labelledby="modal-header"]').firstElementChild.firstElementChild.firstElementChild.
                               style.transitionProperty === 'background-color';
                    } else if (element.parentElement.parentElement.parentElement.parentElement.parentElement.
                               style.transitionProperty === 'background-color') {
                        return true;
                    } else {
                        return false;
                    }
                }(element));

                // addEventListener だと重複登録されてしまうのであえて onclick で
                element.onclick = function(event) {
                    TwitterRevertRT(event, isGalleryMode);
                }
            });

        }, 500);

        // 戻る/進むボタンが押されたとき
        // 各要素が残ってたら後始末
        window.addEventListener('popstate', function() {
            
            // 細画面かどうか
            let isThinWindow = window.innerWidth <= 704;  // 横幅が 704px 以下

            setTimeout(function() {
                let revertrt_style_hide = document.querySelector('.revertrt-style-hide');
                if (revertrt_style_hide !== null) {
                    revertrt_style_hide.remove();
                }
                let revertrt_style = document.querySelector('.revertrt-style');
                if (revertrt_style !== null) {
                    revertrt_style.remove();
                }
                let revertrt_cover = document.querySelector('.revertrt-cover');
                if (revertrt_cover !== null) {
                    revertrt_cover.remove();
                }
                let revertrt_menu = document.querySelector('.revertrt-menu');
                if (revertrt_menu !== null) {
                    revertrt_menu.remove();
                }
                let revertrt_clone_gallery = document.querySelector('div#layers > div.revertrt-clone-gallery');
                if (revertrt_clone_gallery !== null) {
                    revertrt_clone_gallery.remove();
                }
                if (isThinWindow) {
                    let revertrt_clone_header = document.querySelector('header.revertrt-clone-header');
                    if (revertrt_clone_header !== null) {
                        revertrt_clone_header.remove();
                    }
                    let revertrt_clone_main = document.querySelector('main.revertrt-clone-main');
                    if (revertrt_clone_main !== null) {
                        revertrt_clone_main.remove();
                    }
                }
            }, 500);
        });

    }, 500);
}