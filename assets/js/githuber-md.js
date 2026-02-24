

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
            var dialogHtml = '<div id="githuber-toc-dialog" style="max-height: 400px; overflow-y: auto;">';

            if (tocItems.length === 0) {
                dialogHtml += '<p style="color: #999; padding: 20px; text-align: center;">No headings or tables found in document.</p>';
            } else {
                dialogHtml += '<ul style="list-style: none; padding: 0; margin: 0;">';

                tocItems.forEach(function (item, index) {
                    var indent = item.type === 'heading' ? (item.level - 1) * 20 : 0;
                    var icon = item.type === 'heading' ? '📝' : '📊';
                    var itemHtml = '<li style="padding: 8px 12px; border-bottom: 1px solid #eee; cursor: pointer; margin-left: ' + indent + 'px;" data-line="' + item.line + '">';
                    itemHtml += '<span style="margin-right: 8px;">' + icon + '</span>';
                    itemHtml += item.text;
                    itemHtml += '</li>';
                    dialogHtml += itemHtml;
                });

                dialogHtml += '</ul>';
            }

            dialogHtml += '</div>';

            // 创建模态对话框
            var modal = document.createElement('div');
            modal.id = 'githuber-toc-modal';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; align-items: center; justify-content: center;';

            var dialog = document.createElement('div');
            dialog.style.cssText = 'background: white; border-radius: 4px; padding: 0; width: 90%; max-width: 500px; max-height: 600px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';

            var header = document.createElement('div');
            header.style.cssText = 'padding: 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;';
            header.innerHTML = '<h3 style="margin: 0; font-size: 16px;">Document Navigation</h3><button style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">&times;</button>';

            var container = document.createElement('div');
            container.innerHTML = dialogHtml;
            container.style.cssText = 'max-height: 500px; overflow-y: auto;';

            dialog.appendChild(header);
            dialog.appendChild(container);
            modal.appendChild(dialog);
            document.body.appendChild(modal);

            // 延迟恢复滚动位置（确保 DOM 已经完全渲染）
            setTimeout(function () {
                var savedScrollPosition = getTocScrollPosition();
                container.scrollTop = savedScrollPosition;
            }, 0);

            // 关闭对话框函数（保存滚动位置）
            function closeModal() {
                setTocScrollPosition(container.scrollTop);
                modal.remove();
            }

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

            // 绑定列表项点击事件
            container.querySelectorAll('li').forEach(function (item) {
                item.onclick = function (e) {
                    e.stopPropagation();
                    var line = parseInt(this.getAttribute('data-line'));
                    editor.setCursor(line, 0);
                    editor.scrollIntoView({ line: line, ch: 0 }, 200);
                    closeModal();
                };

                item.style.transition = 'background-color 0.2s';
                item.onmouseover = function () {
                    this.style.backgroundColor = '#f5f5f5';
                };
                item.onmouseout = function () {
                    this.style.backgroundColor = 'transparent';
                };
            });
        }
    });
})(jQuery);


