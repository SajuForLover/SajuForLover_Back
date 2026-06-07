import { IsString, IsNotEmpty, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Gender } from "../enums/gender.enum";
import { CalendarType } from "../enums/calendar-type.enum";
import { BirthTime } from "../enums/birth-time.enum";

export class CreateSajuDto {
    @ApiProperty({
        description: '이름',
        example: '홍길동',
        type: String
    })
    @IsNotEmpty()
    @IsString()
    name!: string;

    @ApiProperty({
        description: '성별',
        enum: Gender,
    })
    @IsNotEmpty()
    @IsEnum(Gender, { message: `성별은 '남성' 또는 '여성'이어야 합니다.` })
    gender!: Gender;

    @ApiProperty({
        description: '생년월일',
        example: '1990-01-01',
        type: String
    })
    @IsNotEmpty()
    birthDate!: string; 

    @ApiProperty({
        description: '캘린더',
        enum: CalendarType,
    })
    @IsEnum(CalendarType, { message: `캘린더는 Solar 또는 Lunar이어야 합니다.` })
    calendar!: CalendarType;

    @ApiProperty({
        description: '태어난 시간 (24시간 형식, 예: 09:00)',
        enum: BirthTime
    })
    @IsEnum(BirthTime, { message: `태어난 시간은 진시, 사시, 오시, 미시, 신시, 유시, 술시, 해시, 자시, 축시, 인시, 묘시 중 하나여야 합니다.` })
    birthTime!: BirthTime;

    @ApiProperty({
        description: '출생지',
        example: '대한민국 서울특별시',
        type: String
    })
    @IsString()
    location!: string | '대한민국 서울특별시';

}

