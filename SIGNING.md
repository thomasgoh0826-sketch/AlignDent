# Zyls 数字签名说明

## 当前签名

AlignDent `v0.1.2` 的 Windows 安装包使用 Zyls 自签名代码证书进行 Authenticode 签名，并使用公开时间戳服务记录签署时间。

- 签名者：`CN=Zyls, O=Zyls`
- SHA-1 证书指纹：`B2E06D26E190073DBE3181E08EC31325F09D123A`
- 有效期：2026-09-04 至 2029-09-04
- 公开证书：Release 附件 `Zyls-Code-Signing-Public.cer`

私钥保存在 Zyls 的 Windows 证书库中，不会上传 GitHub，也不会包含在安装包或公开证书中。

## 它能证明什么

- 安装包签名后未被修改。
- 不同版本如果使用相同证书，可以核对是否来自同一个 Zyls 发布密钥。

## 它不能证明什么

自签名证书没有经过受 Windows 信任的认证机构验证，因此不会自动建立发布者身份信任，也不会消除 SmartScreen 提示。请不要为了运行 AlignDent 而把此证书手动加入“受信任的根证书颁发机构”。

未来获得 CA 代码签名证书或使用 Microsoft Store、Microsoft Artifact Signing 等受信任渠道后，应使用受信任签名替代本证书。

## 核对安装包

```powershell
$file = '.\AlignDent-Setup-0.1.2-x64.exe'
Get-FileHash $file -Algorithm SHA256
Get-AuthenticodeSignature $file | Format-List Status,StatusMessage,SignerCertificate,TimeStamperCertificate
```

SHA-256 应为：

`9FACAA7BB390B558C123C01E88AD39F0E207A2003C9BE9D725F3296CDBD616F0`
