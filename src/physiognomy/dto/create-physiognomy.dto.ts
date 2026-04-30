import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreatePhysiognomyDto {
    @ApiProperty({
        description: '사용자 uuid',
        example: 'user-uuid-123',
    })
    @IsString()
    @IsNotEmpty()
    uuid!: string;
}
