

var global_editormd_config = {};
var wp_editor_container = '#wp-content-editor-container';
var wp_editor = 'wp-content-editor-container';
var githuber_md_editor;
var is_support_inline_keyboard_style = false;
var is_support_html_figure = false;
var spellcheck_dictionary_dir = '';
var spellcheck_lang = 'en_US';

// 从 sessionStorage 读取 TOC 导航对话框的滚动位置，如果不存在则为 0
function getTocScrollPosition() {
    var saved = sessionStorage.getItem('githuber_toc_scroll_position');
    return saved ? parseInt(saved) : 0;
}

// 保存 TOC 导航对话框的滚动位置到 sessionStorage
function setTocScrollPosition(position) {
    sessionStorage.setItem('githuber_toc_scroll_position', position);
}

(function ($) {
    $(function () {
        var config = window.editormd_config;

        spellcheck_lang = config.editor_spell_check_lang;
        spellcheck_dictionary_dir = 'https://spellcheck-dictionaries.github.io/' + spellcheck_lang + '/';

        is_support_inline_keyboard_style = (config.support_inline_code_keyboard_style === 'yes');
        is_support_html_figure = (config.support_html_figure === 'yes');

        global_editormd_config = {
            width: '100%',
            height: 640,
            path: config.editor_modules_url,
            placeholder: config.placeholder,
            syncScrolling: (config.editor_sync_scrolling === 'yes'),
            watch: (config.editor_live_preview === 'yes'),
            htmlDecode: (config.editor_html_decode === 'yes'),
            theme: config.editor_toolbar_theme,
            previewTheme: 'default',
            editorTheme: config.editor_editor_theme,
            tocContainer: (config.support_toc === 'yes') ? '' : false,
            emoji: (config.support_emojify === 'yes'),
            tex: (config.support_katex === 'yes'),
            mathJax: (config.support_mathjax === 'yes'),
            flowChart: (config.support_flowchart === 'yes'),
            sequenceDiagram: (config.support_sequence_diagram === 'yes'),
            taskList: (config.support_task_list === 'yes'),
            mermaid: (config.support_mermaid === 'yes'),
            lineNumbers: (config.editor_line_number === 'yes'),
            previewCodeLineNumber: (config.prism_line_number === 'yes'),
            spellCheck: (config.editor_spell_check === 'yes'),
            matchWordHighlight: (config.editor_match_highlighter === 'yes') ? 'onselected' : false,
            toolbarAutoFixed: true,
            tocm: false,
            tocDropdown: false,
            atLink: false,
            imagePasteCallback: config.image_paste_callback,
            toolbarIcons: function () {
                return [
                    'undo', 'redo', '|',
                    'bold', 'del', 'italic', 'quote', '|',
                    'h1', 'h2', 'h3', 'h4', '|',
                    'list-ul', 'list-ol', 'hr', '|',
                    'link', 'reference-link', 'image', 'code', 'code-block', 'table', 'datetime', 'html-entities', 'more', 'pagebreak', config.support_emoji === 'yes' ? 'emoji' : '' + '|',
                    // 'watch', 'preview', 'fullscreen', config.support_emojify === 'yes' ? "emoji" : "", 'help', 'githuber-nav-toc'
                    'watch', 'fullscreen', 'help',
                    'githuber-nav-toc'
                ];
            },
            onfullscreen: function () {
                $(wp_editor_container).css({
                    'position': 'fixed',
                    'z-index': '99999'
                })
            },

            onfullscreenExit: function () {
                $(wp_editor_container).css({
                    'position': 'relative',
                    'z-index': 'auto'
                });
                reload_githuber_md();
            },

            toolbarIconsClass: {
                toc: 'fa-list-alt',
                more: 'fa-ellipsis-h',
                'githuber-nav-toc': 'fa-bookmark'
            },

            toolbarHandlers: {
                toc: function (cm, icon, cursor, selection) {
                    cm.replaceSelection('[toc]');
                },
                more: function (cm, icon, cursor, selection) {
                    cm.replaceSelection('\r\n<!--more-->\r\n');
                },
                'githuber-nav-toc': function (cm, icon, cursor, selection) {
                    githuber_show_nav_toc_dialog(cm);
                }
            },
            lang: {
                toolbar: {
                    toc: 'The Table Of Contents',
                    more: 'More',
                    'githuber-nav-toc': 'Navigate to Heading or Table'
                }
            },
        };

        // TOC 快捷键监听
        var tocDialogOpen = false;
        document.addEventListener('keydown', function (e) {
            // 检查是否为 Mac 系统
            var isMac = /Mac/.test(navigator.platform);
            // 判断是否为 Alt + S 或 Option + S (Mac 上 Option+S 会输出 ß)
            var isAltS = (!isMac && e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && (e.key === 's' || e.key === 'S' || e.key === 'ß'));
            var isOptionS = (isMac && e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && (e.key === 's' || e.key === 'S' || e.key === 'ß'));

            if (isAltS || isOptionS) {
                e.preventDefault();
                var modal = document.getElementById('githuber-toc-modal');
                if (modal) {
                    modal.remove();
                    tocDialogOpen = false;
                } else if (typeof githuber_md_editor !== 'undefined' && githuber_md_editor) {
                    githuber_show_nav_toc_dialog(githuber_md_editor);
                    tocDialogOpen = true;
                }
            }
        });

        if ($(wp_editor_container).length === 1) {
            githuber_md_editor = editormd(wp_editor, global_editormd_config);
        }

        function reload_githuber_md() {
            //  githuber_md_editor = editormd(wp_editor, global_editormd_config);
        }

        if (typeof image_insert_type !== 'undefined') {
            var image_insert_type = 'markdown';
        }
        $(document).on('change', '.githuber_image_insert', function () {
            // html or markdown
            image_insert_type = $(this).val();
        });

        /*
            $(document).ajaxSuccess(function(event, xhr, settings, data) {
                if (settings.url.indexOf('/wp-admin/admin-ajax.php') !== -1 && typeof data.data !== 'undefined') {
                    if (data.success && typeof data.data === 'string') {

                    }
                }
            });
        */

        wp.media.editor.insert = function (html_str) {
            //console.log(html_str);
            var new_content = '';

            if (html_str.substring(0, 4) === '<img') {

                var img_src = $(html_str).attr('src');
                var img_alt = $(html_str).attr('alt');

                if (image_insert_type === 'html') {
                    new_content += html_str;
                } else {
                    new_content += '![' + img_alt + '](' + img_src + ')';
                }

                githuber_md_editor.replaceSelection(new_content);
                image_insert_type = 'markdown';

            } else if (html_str.substring(0, 7) === '<a href' && -1 !== html_str.indexOf('<img')) {

                var a_href = $(html_str).attr('href');
                var img_src = $(html_str).find('img').attr('src');
                var img_alt = $(html_str).find('img').attr('alt');

                if (image_insert_type === 'html') {
                    new_content += html_str;
                } else {
                    new_content += '[![' + img_alt + '](' + img_src + ')](' + a_href + ')';
                }
                githuber_md_editor.replaceSelection(new_content);
                image_insert_type = 'markdown';
            } else if (html_str.substring(0, 1) === '[' && html_str.slice(-1) === ']') {
                new_content += html_str;
                githuber_md_editor.replaceSelection(new_content);
            } else if ((html_str.substring(0, 7) === '<a href')) {
                var ahref = $(html_str).attr('href');
                var inicio_txt = html_str.indexOf('>');
                var fin_txt = html_str.indexOf('<', inicio_txt);
                var txt = html_str.substring(inicio_txt + 1, fin_txt);
                if (image_insert_type === 'html') {
                    new_content += html_str;
                } else {
                    new_content += '[' + txt + '](' + ahref + ' "' + txt + '")';
                }
                githuber_md_editor.replaceSelection(new_content);
            } else {
                console.log(html_str);
            }
        }

        // 显示导航TOC对话框
        function githuber_show_nav_toc_dialog(editor) {
            var content = editor.getValue();
            var tocItems = [];
            var lines = content.split('\n');

            // 匹配标题和表格
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];

                // 匹配标题 (# ## ### 等)
                var headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
                if (headingMatch) {
                    var level = headingMatch[1].length;
                    var text = headingMatch[2].trim();
                    tocItems.push({
                        type: 'heading',
                        level: level,
                        text: text,
                        line: i
                    });
                }

                // 匹配表格首行 (包含 |)
                var tableMatch = line.match(/^\s*\|.+\|\s*$/);
                if (tableMatch && i > 0) {
                    // 检查是否是真实表格（下一行应该是分隔符）
                    if (i + 1 < lines.length) {
                        var nextLine = lines[i + 1];
                        var separatorMatch = nextLine.match(/^\s*\|[\s\-:|]+\|\s*$/);
                        if (separatorMatch) {
                            // 获取表格的第一行内容作为标题
                            var cells = line.split('|').map(function (cell) {
                                return cell.trim();
                            }).filter(function (cell) {
                                return cell.length > 0;
                            });
                            var tableTitle = cells.join(' - ');
                            tocItems.push({
                                type: 'table',
                                text: 'Table: ' + (tableTitle || 'Unnamed'),
                                line: i
                            });
                        }
                    }
                }
            }

            // 创建对话框HTML
            var dialogHtml = '<div id="githuber-toc-dialog">';

            if (tocItems.length === 0) {
                dialogHtml += '<p style="color: #999; padding: 15px; text-align: center;">No headings or tables found in document.</p>';
            } else {
                dialogHtml += '<ul style="list-style: none; padding: 0; margin: 0;">';

                tocItems.forEach(function (item, index) {
                    var indent = item.type === 'heading' ? (item.level - 1) * 16 : (3 - 1) * 16;
                    var icon = item.type === 'heading' ? '📝' : '📊';
                    var itemHtml = '<li style="padding: 5px 10px; border-bottom: 1px solid #eee; cursor: pointer; margin-left: ' + indent + 'px; line-height: 1.3; font-size: 13px;" data-line="' + item.line + '">';
                    itemHtml += '<span style="margin-right: 6px;">' + icon + '</span>';
                    itemHtml += item.text;
                    itemHtml += '</li>';
                    dialogHtml += itemHtml;
                });

                dialogHtml += '</ul>';
            }

            dialogHtml += '</div>';

            // 创建侧边栏容器（不是模态框）
            var modal = document.createElement('div');
            modal.id = 'githuber-toc-modal';
            // 背景透明，仅用于捕获点击事件关闭侧边栏
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: transparent; z-index: 99999; display: block;';

            var dialog = document.createElement('div');
            // 贴右边，不要圆角，不要居中
            dialog.style.cssText = 'position: fixed; top: 0; right: 0; height: 100vh; width: 390px; max-width: 80vw; background: white; box-shadow: -2px 0 10px rgba(0,0,0,0.1); display: flex; flex-direction: column; z-index: 100000;';

            var header = document.createElement('div');
            header.style.cssText = 'padding: 14px 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; background-color: #fafafa; border-left: 1px solid #eee;';
            header.innerHTML = '<h3 style="margin: 0; font-size: 15px; font-weight: 600;">Document Navigation</h3><button style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">&times;</button>';

            var container = document.createElement('div');
            container.innerHTML = dialogHtml;
            container.style.cssText = 'overflow-y: auto; flex: 1; padding: 0;';

            dialog.appendChild(header);
            dialog.appendChild(container);
            modal.appendChild(dialog);
            document.body.appendChild(modal);

            // 阻止 dialog 内部点击事件冒泡到 modal，防止误触关闭
            dialog.addEventListener('click', function (e) {
                e.stopPropagation();
            });

            // 在滚动事件中实时记录位置（使用防抖避免频繁更新）
            var scrollTimeout;
            container.addEventListener('scroll', function () {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(function () {
                    setTocScrollPosition(container.scrollTop);
                }, 100);
            });

            // 延迟恢复滚动位置（确保 DOM 已经完全渲染）
            // 增加延迟时间到 100ms 以确保 DOM 完全准备好
            setTimeout(function () {
                var savedScrollPosition = getTocScrollPosition();
                if (savedScrollPosition > 0) {
                    container.scrollTop = savedScrollPosition;
                }
            }, 100);

            // 关闭对话框函数（保存滚动位置）
            function closeModal() {
                // 关闭时清除滚动位置记录（页面关闭就清空）
                sessionStorage.removeItem('githuber_toc_scroll_position');
                modal.remove();
                tocDialogOpen = false;
            }

            // 支持 ESC 关闭
            var escListener = function (ev) {
                if (ev.key === 'Escape') {
                    var currentModal = document.getElementById('githuber-toc-modal');
                    if (currentModal) {
                        closeModal();
                        document.removeEventListener('keydown', escListener, true);
                    }
                }
            };
            document.addEventListener('keydown', escListener, true);

            // 绑定关闭按钮事件
            header.querySelector('button').onclick = function () {
                closeModal();
            };

            // 绑定背景点击关闭事件
            modal.onclick = function (e) {
                if (e.target === modal) {
                    closeModal();
                }
            };

            // 使用事件委托处理列表项点击事件（侧边栏不关闭，继续编辑）
            container.addEventListener('click', function (e) {
                var target = e.target;
                var item = null;

                // 如果点击的是 li 元素
                if (target.tagName === 'LI') {
                    item = target;
                }
                // 如果点击的是 li 内部的元素（如 span）
                else if (target.parentElement && target.parentElement.tagName === 'LI') {
                    item = target.parentElement;
                }

                // 如果找到了 li 元素且有 data-line 属性
                if (item && item.getAttribute('data-line')) {
                    e.preventDefault();
                    e.stopPropagation();
                    var line = parseInt(item.getAttribute('data-line'));
                    editor.setCursor(line, 0);
                    editor.scrollIntoView({ line: line, ch: 0 }, 200);
                    // ✅ 移除 closeModal() - 侧边栏不关闭，用户可继续选择其他项
                    return false;
                }
            });

            // 为列表项添加悬停样式
            container.addEventListener('mouseenter', function (e) {
                if (e.target.tagName === 'LI' || e.target.closest('li')) {
                    var item = e.target.tagName === 'LI' ? e.target : e.target.closest('li');
                    item.style.transition = 'background-color 0.2s';
                    item.style.backgroundColor = '#f9f9f9';
                }
            }, true);

            container.addEventListener('mouseleave', function (e) {
                if (e.target.tagName === 'LI' || e.target.closest('li')) {
                    var item = e.target.tagName === 'LI' ? e.target : e.target.closest('li');
                    item.style.backgroundColor = 'transparent';
                }
            }, true);

            tocDialogOpen = true;
        }
    });
})(jQuery);


