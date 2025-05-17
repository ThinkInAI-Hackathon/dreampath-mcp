#!/bin/bash

# 自动执行 git flow release 流程

# 获取最近的版本号（从 git 标签）
latest_version=$(git describe --tags --abbrev=0 2>/dev/null || echo "无版本标签")

# 显示最近版本号
echo "最近版本号: $latest_version"

# 提示输入新版本号
read -p "请输入新版本号 (例如 v1.2.3): " new_version

# 确认是否继续
read -p "将创建并完成版本 $new_version 的发布, 是否继续? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "已取消操作"
    exit 0
fi

# 开始 release
echo "开始创建版本 $new_version 的发布..."
git flow release start "$new_version"

if [ $? -ne 0 ]; then
    echo "创建发布失败，请检查 git flow 是否正确安装或初始化"
    exit 1
fi

# 询问是否需要修改文件
read -p "是否需要修改文件? 完成后按 y 继续 (y/n): " edit_files
if [ "$edit_files" == "y" ]; then
    echo "请修改必要的文件，然后继续..."
    read -p "文件修改完成? 按回车继续..."
    
    # 提交修改
    git add .
    git commit -m "版本更新至 $new_version"
fi

# 设置环境变量，防止git打开编辑器请求输入commit消息
export GIT_MERGE_AUTOEDIT=no

# 准备提交消息
tag_message="发布版本 $new_version"
merge_message="将版本 $new_version 合并到主分支"

# 完成 release
echo "完成版本 $new_version 的发布..."
git flow release finish -m "$tag_message" "$new_version"

if [ $? -ne 0 ]; then
    echo "完成发布失败"
    # 还原环境变量
    unset GIT_MERGE_AUTOEDIT
    exit 1
fi

# 还原环境变量
unset GIT_MERGE_AUTOEDIT

# 推送主分支、开发分支和标签
echo "推送所有更改到远程仓库..."
git push origin develop
git push origin main
git push --tags

echo ""
echo "版本 $new_version 发布完成!" 