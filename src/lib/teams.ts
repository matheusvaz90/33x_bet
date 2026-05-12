type TeamInfo = { flag: string; name: string; color: string };

const C = {
  green: "#00d68f",
  yellow: "#ffd62a",
  red: "#ff4d6d",
  blue: "#3a86ff",
  navy: "#0d2c5b",
  purple: "#a259ff",
  orange: "#ff9f1c",
  white: "#e4e4e7",
  black: "#27272a",
  cyan: "#22d3ee",
  pink: "#f472b6",
  teal: "#14b8a6",
  gold: "#f5c842",
};

const MAP: Record<string, TeamInfo> = {
  // host nations
  "United States": { flag: "🇺🇸", name: "Estados Unidos", color: C.blue },
  USA: { flag: "🇺🇸", name: "Estados Unidos", color: C.blue },
  Canada: { flag: "🇨🇦", name: "Canadá", color: C.red },
  Mexico: { flag: "🇲🇽", name: "México", color: C.green },

  // CONMEBOL
  Brazil: { flag: "🇧🇷", name: "Brasil", color: C.yellow },
  Argentina: { flag: "🇦🇷", name: "Argentina", color: C.cyan },
  Uruguay: { flag: "🇺🇾", name: "Uruguai", color: "#5ac8fa" },
  Colombia: { flag: "🇨🇴", name: "Colômbia", color: C.yellow },
  Ecuador: { flag: "🇪🇨", name: "Equador", color: C.yellow },
  Paraguay: { flag: "🇵🇾", name: "Paraguai", color: C.red },
  Chile: { flag: "🇨🇱", name: "Chile", color: C.red },
  Peru: { flag: "🇵🇪", name: "Peru", color: C.red },
  Bolivia: { flag: "🇧🇴", name: "Bolívia", color: C.green },
  Venezuela: { flag: "🇻🇪", name: "Venezuela", color: "#fbbf24" },

  // UEFA
  France: { flag: "🇫🇷", name: "França", color: C.blue },
  Germany: { flag: "🇩🇪", name: "Alemanha", color: C.black },
  Spain: { flag: "🇪🇸", name: "Espanha", color: C.red },
  Italy: { flag: "🇮🇹", name: "Itália", color: "#1e40af" },
  Portugal: { flag: "🇵🇹", name: "Portugal", color: "#b91c1c" },
  Netherlands: { flag: "🇳🇱", name: "Holanda", color: C.orange },
  Belgium: { flag: "🇧🇪", name: "Bélgica", color: C.red },
  Croatia: { flag: "🇭🇷", name: "Croácia", color: C.red },
  Denmark: { flag: "🇩🇰", name: "Dinamarca", color: C.red },
  Switzerland: { flag: "🇨🇭", name: "Suíça", color: C.red },
  Poland: { flag: "🇵🇱", name: "Polônia", color: "#dc2626" },
  Serbia: { flag: "🇷🇸", name: "Sérvia", color: C.red },
  Austria: { flag: "🇦🇹", name: "Áustria", color: C.red },
  Sweden: { flag: "🇸🇪", name: "Suécia", color: C.yellow },
  Norway: { flag: "🇳🇴", name: "Noruega", color: C.red },
  Wales: { flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", name: "País de Gales", color: C.red },
  Scotland: { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", name: "Escócia", color: C.navy },
  England: { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", name: "Inglaterra", color: C.white },
  Czechia: { flag: "🇨🇿", name: "República Tcheca", color: C.red },
  Hungary: { flag: "🇭🇺", name: "Hungria", color: C.red },
  Romania: { flag: "🇷🇴", name: "Romênia", color: C.yellow },
  Ukraine: { flag: "🇺🇦", name: "Ucrânia", color: C.yellow },
  Turkey: { flag: "🇹🇷", name: "Turquia", color: C.red },
  Ireland: { flag: "🇮🇪", name: "Irlanda", color: C.green },
  Slovakia: { flag: "🇸🇰", name: "Eslováquia", color: C.blue },
  Slovenia: { flag: "🇸🇮", name: "Eslovênia", color: C.blue },
  Greece: { flag: "🇬🇷", name: "Grécia", color: C.blue },
  Albania: { flag: "🇦🇱", name: "Albânia", color: C.red },
  "Bosnia and Herzegovina": { flag: "🇧🇦", name: "Bósnia", color: C.blue },
  Finland: { flag: "🇫🇮", name: "Finlândia", color: C.blue },
  Iceland: { flag: "🇮🇸", name: "Islândia", color: C.blue },
  Russia: { flag: "🇷🇺", name: "Rússia", color: C.red },

  // CONCACAF
  "Costa Rica": { flag: "🇨🇷", name: "Costa Rica", color: C.red },
  Panama: { flag: "🇵🇦", name: "Panamá", color: C.red },
  Honduras: { flag: "🇭🇳", name: "Honduras", color: C.blue },
  Jamaica: { flag: "🇯🇲", name: "Jamaica", color: C.yellow },
  "El Salvador": { flag: "🇸🇻", name: "El Salvador", color: C.blue },
  Guatemala: { flag: "🇬🇹", name: "Guatemala", color: C.blue },
  Haiti: { flag: "🇭🇹", name: "Haiti", color: C.red },
  "Trinidad and Tobago": { flag: "🇹🇹", name: "Trinidad e Tobago", color: C.red },
  Curaçao: { flag: "🇨🇼", name: "Curaçao", color: C.blue },
  Curacao: { flag: "🇨🇼", name: "Curaçao", color: C.blue },

  // CAF
  Morocco: { flag: "🇲🇦", name: "Marrocos", color: C.red },
  Senegal: { flag: "🇸🇳", name: "Senegal", color: C.green },
  Tunisia: { flag: "🇹🇳", name: "Tunísia", color: C.red },
  Egypt: { flag: "🇪🇬", name: "Egito", color: C.red },
  Algeria: { flag: "🇩🇿", name: "Argélia", color: C.green },
  Nigeria: { flag: "🇳🇬", name: "Nigéria", color: C.green },
  Ghana: { flag: "🇬🇭", name: "Gana", color: C.red },
  Cameroon: { flag: "🇨🇲", name: "Camarões", color: C.green },
  "Ivory Coast": { flag: "🇨🇮", name: "Costa do Marfim", color: C.orange },
  "Côte d'Ivoire": { flag: "🇨🇮", name: "Costa do Marfim", color: C.orange },
  Mali: { flag: "🇲🇱", name: "Mali", color: C.green },
  "South Africa": { flag: "🇿🇦", name: "África do Sul", color: C.green },
  "Cape Verde": { flag: "🇨🇻", name: "Cabo Verde", color: C.blue },
  "Cabo Verde": { flag: "🇨🇻", name: "Cabo Verde", color: C.blue },
  "DR Congo": { flag: "🇨🇩", name: "RD Congo", color: C.blue },
  "Congo DR": { flag: "🇨🇩", name: "RD Congo", color: C.blue },

  // AFC
  Japan: { flag: "🇯🇵", name: "Japão", color: C.red },
  "South Korea": { flag: "🇰🇷", name: "Coreia do Sul", color: C.red },
  Korea: { flag: "🇰🇷", name: "Coreia do Sul", color: C.red },
  "Republic of Korea": { flag: "🇰🇷", name: "Coreia do Sul", color: C.red },
  Australia: { flag: "🇦🇺", name: "Austrália", color: C.yellow },
  "Saudi Arabia": { flag: "🇸🇦", name: "Arábia Saudita", color: C.green },
  Iran: { flag: "🇮🇷", name: "Irã", color: C.green },
  "IR Iran": { flag: "🇮🇷", name: "Irã", color: C.green },
  Qatar: { flag: "🇶🇦", name: "Catar", color: "#8e3a59" },
  "United Arab Emirates": { flag: "🇦🇪", name: "Emirados Árabes", color: C.red },
  UAE: { flag: "🇦🇪", name: "Emirados Árabes", color: C.red },
  Iraq: { flag: "🇮🇶", name: "Iraque", color: C.red },
  Uzbekistan: { flag: "🇺🇿", name: "Uzbequistão", color: C.blue },
  Jordan: { flag: "🇯🇴", name: "Jordânia", color: C.red },
  "New Zealand": { flag: "🇳🇿", name: "Nova Zelândia", color: C.black },
  China: { flag: "🇨🇳", name: "China", color: C.red },

  // playoff
  Suriname: { flag: "🇸🇷", name: "Suriname", color: C.green },
  "New Caledonia": { flag: "🇳🇨", name: "Nova Caledônia", color: C.blue },

  // TBD
  "A definir": { flag: "❓", name: "A definir", color: "#52525b" },
  TBD: { flag: "❓", name: "A definir", color: "#52525b" },
};

export function team(name: string): TeamInfo {
  return MAP[name] || { flag: "⚽", name, color: "#52525b" };
}
