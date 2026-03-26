package com.learnapp.study.entity;

/** Catalog of all available badges with their display metadata. */
public enum BadgeDefinition {

    FIRST_SESSION ("first_session",  "Bước đầu tiên",       "Hoàn thành phiên học đầu tiên của bạn",          "🎯"),
    POMODORO_5    ("pomodoro_5",     "Chiến binh mới",       "Hoàn thành 5 phiên Pomodoro",                    "⏱️"),
    POMODORO_25   ("pomodoro_25",    "Chiến binh Pomodoro",  "Hoàn thành 25 phiên Pomodoro",                   "⚡"),
    STREAK_3      ("streak_3",       "Khởi động tốt",        "Duy trì streak 3 ngày liên tiếp",                "🔥"),
    STREAK_7      ("streak_7",       "Tuần hoàn hảo",        "Duy trì streak 7 ngày liên tiếp",                "🏅"),
    STREAK_30     ("streak_30",      "Bậc thầy kỷ luật",     "Duy trì streak 30 ngày liên tiếp",               "🏆"),
    NIGHT_OWL     ("night_owl",      "Cú đêm",               "Hoàn thành phiên học sau 22:00",                 "🦉"),
    EARLY_BIRD    ("early_bird",     "Chim sớm",             "Hoàn thành phiên học trước 6:00",                "🐦"),
    MARATHON      ("marathon",       "Marathon học tập",      "Học liên tục hơn 60 phút trong một phiên",      "🏃"),
    CENTURION     ("centurion",      "Bách chiến bách thắng", "Hoàn thành 100 phiên học",                      "💯");

    public final String code;
    public final String name;
    public final String description;
    public final String emoji;

    BadgeDefinition(String code, String name, String description, String emoji) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.emoji = emoji;
    }

    public static BadgeDefinition fromCode(String code) {
        for (BadgeDefinition b : values()) {
            if (b.code.equals(code)) return b;
        }
        return null;
    }
}
