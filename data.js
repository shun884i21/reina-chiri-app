// レイナのチリ勉強アプリ - 学習データ
// 中1社会・地理：日本（47都道府県）＋世界の主要国

// ===== 日本編：都道府県データ（おおむね北→南の順） =====
// id, 名前, 県庁所在地, 地方, 名産, 気候・地形メモ
const PREFECTURES = [
  // 北海道・東北地方
  { id:"hokkaido", name:"北海道", capital:"札幌", region:"北海道", meibutsu:"じゃがいも・乳製品", note:"梅雨がなく冬の雪が多い（冷帯）。石狩平野。" },
  { id:"aomori",   name:"青森県", capital:"青森", region:"東北", meibutsu:"りんご", note:"世界自然遺産・白神山地。やませで冷害。" },
  { id:"iwate",    name:"岩手県", capital:"盛岡", region:"東北", meibutsu:"わんこそば・南部鉄器", note:"本州で最も広い県。三陸海岸はリアス海岸。" },
  { id:"miyagi",   name:"宮城県", capital:"仙台", region:"東北", meibutsu:"笹かまぼこ・牛タン", note:"東北地方の中心都市・仙台。仙台平野。" },
  { id:"akita",    name:"秋田県", capital:"秋田", region:"東北", meibutsu:"きりたんぽ・あきたこまち", note:"八郎潟の干拓で有名。日本海側で雪が多い。" },
  { id:"yamagata", name:"山形県", capital:"山形", region:"東北", meibutsu:"さくらんぼ", note:"最上川が流れる。盆地でくだもの作りがさかん。" },
  { id:"fukushima",name:"福島県", capital:"福島", region:"東北", meibutsu:"もも", note:"東北で一番広い面積。会津・中通り・浜通り。" },
  // 関東地方
  { id:"ibaraki",  name:"茨城県", capital:"水戸", region:"関東", meibutsu:"納豆・メロン", note:"近郊農業がさかん。霞ヶ浦がある。" },
  { id:"tochigi",  name:"栃木県", capital:"宇都宮", region:"関東", meibutsu:"いちご（とちおとめ）", note:"日光東照宮。内陸県で夏は雷が多い。" },
  { id:"gunma",    name:"群馬県", capital:"前橋", region:"関東", meibutsu:"こんにゃく・キャベツ", note:"嬬恋村の高原野菜。からっ風がふく内陸県。" },
  { id:"saitama",  name:"埼玉県", capital:"さいたま", region:"関東", meibutsu:"深谷ねぎ", note:"海のない内陸県。東京のベッドタウン。" },
  { id:"chiba",    name:"千葉県", capital:"千葉", region:"関東", meibutsu:"落花生", note:"成田国際空港。近郊農業がさかん。" },
  { id:"tokyo",    name:"東京都", capital:"東京（新宿）", region:"関東", meibutsu:"江戸切子", note:"日本の首都。人口が最も多い。" },
  { id:"kanagawa", name:"神奈川県", capital:"横浜", region:"関東", meibutsu:"シウマイ・みかん", note:"横浜港・京浜工業地帯。人口は全国2位。" },
  // 中部地方
  { id:"niigata",  name:"新潟県", capital:"新潟", region:"中部", meibutsu:"米（コシヒカリ）・日本酒", note:"信濃川が流れる。日本海側で雪が多い。" },
  { id:"toyama",   name:"富山県", capital:"富山", region:"中部", meibutsu:"ます寿司・ホタルイカ", note:"立山連峰・黒部ダム。富山平野。" },
  { id:"ishikawa", name:"石川県", capital:"金沢", region:"中部", meibutsu:"輪島塗・加賀友禅", note:"能登半島。伝統工芸がさかん。" },
  { id:"fukui",    name:"福井県", capital:"福井", region:"中部", meibutsu:"越前がに・めがね（鯖江）", note:"日本海側の気候。恐竜の化石でも有名。" },
  { id:"yamanashi",name:"山梨県", capital:"甲府", region:"中部", meibutsu:"ぶどう・もも・ワイン", note:"富士山・甲府盆地。海のない内陸県。" },
  { id:"nagano",   name:"長野県", capital:"長野", region:"中部", meibutsu:"りんご・レタス・そば", note:"日本アルプス。内陸性気候で高原野菜。" },
  { id:"gifu",     name:"岐阜県", capital:"岐阜", region:"中部", meibutsu:"飛騨牛・美濃焼", note:"白川郷の合掌造り（世界遺産）。" },
  { id:"shizuoka", name:"静岡県", capital:"静岡", region:"中部", meibutsu:"お茶・みかん", note:"富士山。茶の生産が日本トップクラス。" },
  { id:"aichi",    name:"愛知県", capital:"名古屋", region:"中部", meibutsu:"八丁味噌・自動車", note:"中京工業地帯。自動車工業がさかん。" },
  // 近畿地方
  { id:"mie",      name:"三重県", capital:"津", region:"近畿", meibutsu:"真珠・松阪牛・伊勢えび", note:"志摩半島はリアス海岸。伊勢神宮。" },
  { id:"shiga",    name:"滋賀県", capital:"大津", region:"近畿", meibutsu:"近江牛", note:"日本最大の湖・琵琶湖がある。" },
  { id:"kyoto",    name:"京都府", capital:"京都", region:"近畿", meibutsu:"西陣織・清水焼・抹茶", note:"昔の都。多くの世界遺産・寺社。" },
  { id:"osaka",    name:"大阪府", capital:"大阪", region:"近畿", meibutsu:"たこ焼き", note:"西日本の中心都市。阪神工業地帯。" },
  { id:"hyogo",    name:"兵庫県", capital:"神戸", region:"近畿", meibutsu:"神戸牛・明石焼き", note:"神戸港。日本標準時の明石市がある。" },
  { id:"nara",     name:"奈良県", capital:"奈良", region:"近畿", meibutsu:"奈良漬・大仏", note:"昔の都・平城京。海のない内陸県。" },
  { id:"wakayama", name:"和歌山県", capital:"和歌山", region:"近畿", meibutsu:"みかん・梅", note:"温暖な気候。紀伊山地は雨が多い。" },
  // 中国・四国地方
  { id:"tottori",  name:"鳥取県", capital:"鳥取", region:"中国・四国", meibutsu:"二十世紀梨", note:"鳥取砂丘。人口が最も少ない県。" },
  { id:"shimane",  name:"島根県", capital:"松江", region:"中国・四国", meibutsu:"出雲そば・しじみ", note:"出雲大社。石見銀山（世界遺産）。" },
  { id:"okayama",  name:"岡山県", capital:"岡山", region:"中国・四国", meibutsu:"もも・マスカット", note:"瀬戸内式気候で雨が少なくくだもの作り。" },
  { id:"hiroshima",name:"広島県", capital:"広島", region:"中国・四国", meibutsu:"かき・お好み焼き・レモン", note:"原爆ドーム・厳島神社（世界遺産）。" },
  { id:"yamaguchi",name:"山口県", capital:"山口", region:"中国・四国", meibutsu:"ふぐ", note:"本州の西のはし。秋吉台のカルスト地形。" },
  { id:"tokushima",name:"徳島県", capital:"徳島", region:"中国・四国", meibutsu:"すだち・鳴門わかめ", note:"鳴門のうず潮。阿波おどり。" },
  { id:"kagawa",   name:"香川県", capital:"高松", region:"中国・四国", meibutsu:"うどん", note:"日本で一番小さい県。雨が少なくため池が多い。" },
  { id:"ehime",    name:"愛媛県", capital:"松山", region:"中国・四国", meibutsu:"みかん・今治タオル", note:"瀬戸内のしまなみ海道。みかん作りがさかん。" },
  { id:"kochi",    name:"高知県", capital:"高知", region:"中国・四国", meibutsu:"かつお・ゆず", note:"四万十川。太平洋側で降水量が多い。" },
  // 九州・沖縄地方
  { id:"fukuoka",  name:"福岡県", capital:"福岡", region:"九州・沖縄", meibutsu:"明太子・とんこつラーメン", note:"九州地方の中心都市。北九州工業地帯。" },
  { id:"saga",     name:"佐賀県", capital:"佐賀", region:"九州・沖縄", meibutsu:"有田焼・のり", note:"有明海ののり養殖。焼き物が有名。" },
  { id:"nagasaki", name:"長崎県", capital:"長崎", region:"九州・沖縄", meibutsu:"カステラ・ちゃんぽん", note:"島がとても多い。昔の貿易の窓口・出島。" },
  { id:"kumamoto", name:"熊本県", capital:"熊本", region:"九州・沖縄", meibutsu:"いぐさ（畳）・馬刺し", note:"阿蘇山の世界最大級のカルデラ。" },
  { id:"oita",     name:"大分県", capital:"大分", region:"九州・沖縄", meibutsu:"かぼす・温泉", note:"別府・湯布院など温泉がとても多い。" },
  { id:"miyazaki", name:"宮崎県", capital:"宮崎", region:"九州・沖縄", meibutsu:"マンゴー・地鶏", note:"温暖な気候。ビニールハウスの促成栽培。" },
  { id:"kagoshima",name:"鹿児島県", capital:"鹿児島", region:"九州・沖縄", meibutsu:"さつまいも・黒豚", note:"桜島・シラス台地。屋久島（世界遺産）。" },
  { id:"okinawa",  name:"沖縄県", capital:"那覇", region:"九州・沖縄", meibutsu:"さとうきび・ゴーヤ・パイナップル", note:"亜熱帯の気候。さんご礁の海。" },
];

// 日本編のステージ（地方ごと）。順番が学習順。
const JAPAN_STAGES = [
  { id:"jp-tohoku", title:"北海道・東北地方", region:"北海道", regions:["北海道","東北"], emoji:"❄️" },
  { id:"jp-kanto",  title:"関東地方",        regions:["関東"], emoji:"🗼" },
  { id:"jp-chubu",  title:"中部地方",        regions:["中部"], emoji:"🗻" },
  { id:"jp-kinki",  title:"近畿地方",        regions:["近畿"], emoji:"🦌" },
  { id:"jp-chushikoku", title:"中国・四国地方", regions:["中国・四国"], emoji:"🍊" },
  { id:"jp-kyushu", title:"九州・沖縄地方",  regions:["九州・沖縄"], emoji:"🌺" },
];

// ===== 海外編：世界の主要国データ =====
// 経度lon・緯度latは世界地図に点を打つために使用（だいたいの首都の位置）
const COUNTRIES = [
  // アジア
  { id:"china",   name:"中国",        capital:"ペキン（北京）", continent:"アジア",     flag:"🇨🇳", lon:116, lat:40,  feature:"世界で最も人口が多い国の一つ。万里の長城。" },
  { id:"korea",   name:"韓国",        capital:"ソウル",        continent:"アジア",     flag:"🇰🇷", lon:127, lat:37,  feature:"日本のとなりの国。キムチが有名。" },
  { id:"india",   name:"インド",      capital:"ニューデリー",   continent:"アジア",     flag:"🇮🇳", lon:77,  lat:28,  feature:"人口がとても多い。カレー・ガンジス川・タージマハル。" },
  { id:"thailand",name:"タイ",        capital:"バンコク",      continent:"アジア",     flag:"🇹🇭", lon:100, lat:13,  feature:"米作りがさかん。象や寺院が有名。" },
  { id:"saudi",   name:"サウジアラビア", capital:"リヤド",      continent:"アジア",     flag:"🇸🇦", lon:46,  lat:24,  feature:"砂漠が広がる。石油の輸出が世界有数。" },
  // ヨーロッパ
  { id:"uk",      name:"イギリス",    capital:"ロンドン",      continent:"ヨーロッパ", flag:"🇬🇧", lon:0,   lat:51,  feature:"産業革命がおきた国。本初子午線が通る。" },
  { id:"france",  name:"フランス",    capital:"パリ",          continent:"ヨーロッパ", flag:"🇫🇷", lon:2,   lat:48,  feature:"ヨーロッパ最大の農業国。エッフェル塔。" },
  { id:"germany", name:"ドイツ",      capital:"ベルリン",      continent:"ヨーロッパ", flag:"🇩🇪", lon:13,  lat:52,  feature:"ヨーロッパの工業の中心。ソーセージ・ビール。" },
  { id:"italy",   name:"イタリア",    capital:"ローマ",        continent:"ヨーロッパ", flag:"🇮🇹", lon:12,  lat:41,  feature:"地中海性気候。パスタ・ピザ・古代ローマ。" },
  { id:"russia",  name:"ロシア",      capital:"モスクワ",      continent:"ヨーロッパ", flag:"🇷🇺", lon:37,  lat:55,  feature:"世界で一番面積が大きい国。冷帯のタイガ。" },
  // アフリカ
  { id:"egypt",   name:"エジプト",    capital:"カイロ",        continent:"アフリカ",   flag:"🇪🇬", lon:31,  lat:30,  feature:"ナイル川とピラミッド。砂漠が広がる。" },
  { id:"kenya",   name:"ケニア",      capital:"ナイロビ",      continent:"アフリカ",   flag:"🇰🇪", lon:36,  lat:-1,  feature:"赤道が通る。サバナで野生動物が多い。" },
  { id:"safrica", name:"南アフリカ共和国", capital:"プレトリア", continent:"アフリカ",  flag:"🇿🇦", lon:28,  lat:-25, feature:"金やダイヤモンドがとれる。アフリカ最南部。" },
  // 北アメリカ
  { id:"usa",     name:"アメリカ合衆国", capital:"ワシントンD.C.", continent:"北アメリカ", flag:"🇺🇸", lon:-77, lat:38, feature:"世界一の経済大国。50の州からなる。" },
  { id:"canada",  name:"カナダ",      capital:"オタワ",        continent:"北アメリカ", flag:"🇨🇦", lon:-75, lat:45,  feature:"世界2位の面積。森林と湖が多い。" },
  { id:"mexico",  name:"メキシコ",    capital:"メキシコシティ", continent:"北アメリカ", flag:"🇲🇽", lon:-99, lat:19, feature:"とうもろこし発祥。タコス・古代文明。" },
  // 南アメリカ
  { id:"brazil",  name:"ブラジル",    capital:"ブラジリア",    continent:"南アメリカ", flag:"🇧🇷", lon:-47, lat:-15, feature:"アマゾン川と熱帯雨林。コーヒー・サッカー。" },
  { id:"argentina",name:"アルゼンチン", capital:"ブエノスアイレス", continent:"南アメリカ", flag:"🇦🇷", lon:-58, lat:-34, feature:"パンパの草原で牛の放牧。牛肉が有名。" },
  // オセアニア
  { id:"australia",name:"オーストラリア", capital:"キャンベラ",  continent:"オセアニア", flag:"🇦🇺", lon:149, lat:-35, feature:"南半球の大陸の国。コアラ・カンガルー・鉱産資源。" },
  { id:"nz",      name:"ニュージーランド", capital:"ウェリントン", continent:"オセアニア", flag:"🇳🇿", lon:174, lat:-41, feature:"羊の牧畜がさかん。南半球で日本と季節が逆。" },
];

// 海外編は1ヶ国＝1ステージ
const WORLD_STAGES = COUNTRIES.map(c => ({
  id: "w-" + c.id,
  title: c.name,
  emoji: c.flag,
  countryId: c.id,
}));

// ===== 都道府県の地形・気候クイズ（curated・4択用） =====
// q:問題文, a:正解, choices:他の選択肢(誤答)
const GEO_QUIZ = [
  { q:"日本で一番大きい湖『琵琶湖』があるのは？", a:"滋賀県", choices:["長野県","秋田県","茨城県"] },
  { q:"鳥取砂丘があるのは？", a:"鳥取県", choices:["島根県","山口県","新潟県"] },
  { q:"世界最大級のカルデラをもつ『阿蘇山』があるのは？", a:"熊本県", choices:["鹿児島県","大分県","宮崎県"] },
  { q:"『桜島』とシラス台地があるのは？", a:"鹿児島県", choices:["熊本県","長崎県","宮崎県"] },
  { q:"信濃川が流れ、雪がとても多いのは？", a:"新潟県", choices:["富山県","秋田県","北海道"] },
  { q:"日本アルプスがあり、高原野菜づくりがさかんなのは？", a:"長野県", choices:["岐阜県","山梨県","群馬県"] },
  { q:"亜熱帯の気候でさんご礁の海が広がるのは？", a:"沖縄県", choices:["鹿児島県","高知県","宮崎県"] },
  { q:"梅雨がなく、冬の雪が多い冷帯の地方は？", a:"北海道", choices:["東北","九州","関東"] },
  { q:"雨が少なく『ため池』が多い、日本で一番小さい県は？", a:"香川県", choices:["徳島県","愛媛県","佐賀県"] },
  { q:"志摩半島などのリアス海岸と真珠の養殖で有名なのは？", a:"三重県", choices:["和歌山県","愛媛県","長崎県"] },
  { q:"合掌造りの『白川郷』（世界遺産）があるのは？", a:"岐阜県", choices:["富山県","長野県","新潟県"] },
  { q:"立山連峰と『黒部ダム』があるのは？", a:"富山県", choices:["石川県","新潟県","長野県"] },
  { q:"太平洋側で降水量が多く、四万十川が流れるのは？", a:"高知県", choices:["和歌山県","三重県","宮崎県"] },
  { q:"日本標準時（明石）が通り、神戸港があるのは？", a:"兵庫県", choices:["大阪府","岡山県","広島県"] },
  { q:"八郎潟の干拓で有名なのは？", a:"秋田県", choices:["青森県","山形県","新潟県"] },
];
