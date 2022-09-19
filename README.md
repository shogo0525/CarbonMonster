<img width=700 src="https://user-images.githubusercontent.com/6888594/191008463-58306ac8-aa95-407f-9c02-cfe5f382826b.png" />

# Carbon Monster 概要

- Solidity, Hardhat, React を学習するためのテストプロジェクト
- [DEMO SITE](https://carbon-monster.vercel.app/)

## できること

- `Carbon Monster` NFT のミント
  - NFT はフルオンチェーン（SVG）
  - SVG でモンスターを表現したかったが、SVG の理解が乏しいため現在はただの円で表現
- `Carbon Monster` への餌やり
  - 特定の ERC20 トークンを餌として与える
    - トークンはカーボンオフセットを行える、外部のプロトコル(`Toucan Protocol`)を使用
  - 餌を与えると、`Carbon Monster` が成長する（円が拡大していく）
  - と同時に外部のスマートコントラクトを呼びカーボンオフセットをする（現在は `Mumbai Testnet` なので実際のオフセットにはならない）

## 今後やりたいこと

- SVG でモンスターを表現し、餌を与えるといい感じに成長するようにしたい
- 餌を与えるためのトークンの一部をコントラクト側が手数料として保持し、そのトークンの使い道を NFT ホルダーで決めるなど
- 楽しくカーボンオフセットを実現できるようなサービスにできたら理想的
- 餌やり(`feed`)と同時に行っているトークンの `approve` を UI として分けたい
- 餌やりのトークン数の指定

## 開発環境

- Hardhat でスマートコントラクトの実装
- React(Next,js)と Chakra UI でフロントエンドを実装
- １つのリポジトリにまとめ、スマコンのデプロイ結果のアドレスと ABI をフロントエンドで使えるように自動化
