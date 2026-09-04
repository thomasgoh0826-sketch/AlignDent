# 参与贡献

感谢你帮助改进 AlignDent。

## 提交问题

- 不要上传真实患者照片、姓名、病历号或其他可识别信息。
- 请说明 Windows 版本、AlignDent 版本、复现步骤和预期结果。
- 如需示例图片，请使用虚构人物、公开测试图或经过充分脱敏的素材。

## 提交代码

1. Fork 仓库并创建独立分支。
2. 保持改动聚焦，并为行为变化增加测试。
3. 提交前运行：

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm run build
```

4. 在 Pull Request 中解释用户问题、解决方式和验证结果。

贡献代码即表示你同意授予 Zyls 在 [LICENSE](LICENSE) 第 3 条所列的贡献使用权。独立发布修改版或衍生版本仍需获得 Zyls 书面许可。
