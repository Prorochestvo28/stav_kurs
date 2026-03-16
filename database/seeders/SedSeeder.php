<?php

namespace Database\Seeders;

use App\Models\ApprovalProcess;
use App\Models\ApprovalStep;
use App\Models\Category;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\DocumentVersion;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SedSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'ПТО', 'description' => 'Производственно-технический отдел'],
            ['name' => 'ИТ-отдел', 'description' => 'Информационные технологии и поддержка пользователей'],
            ['name' => 'Бухгалтерия', 'description' => 'Финансовый учет и отчетность'],
            ['name' => 'Отдел продаж', 'description' => 'Коммерческий блок и работа с клиентами'],
            ['name' => 'Отдел снабжения', 'description' => 'Закупки и логистика материалов'],
        ];
        foreach ($departments as $d) {
            Department::firstOrCreate(['name' => $d['name']], $d);
        }

        $usersData = [
            [
                'email' => 'admin@stav.ltd',
                'full_name' => 'Пророков Максим Евгеньевич',
                'password' => 'admin123',
                'position' => 'Главный инженер',
                'department' => 'ПТО',
                'phone' => '+7 (928) 555-44-33',
                'role' => 'admin',
            ],
            [
                'email' => 'prorokov_2019@mail.ru',
                'full_name' => 'Пророков Редактор',
                'password' => '12345678',
                'position' => 'Редактор документов',
                'department' => 'ПТО',
                'phone' => '+7 (928) 555-44-11',
                'role' => 'editor',
            ],
            [
                'email' => 'prorokov_2018@mail.ru',
                'full_name' => 'Пророков Просмотрщик',
                'password' => '12345678',
                'position' => 'Специалист',
                'department' => 'ПТО',
                'phone' => '+7 (928) 555-44-22',
                'role' => 'user',
            ],
            [
                'email' => 'ivanov@stav.ltd',
                'full_name' => 'Иванов Иван Иванович',
                'password' => 'password',
                'position' => 'Инженер-конструктор',
                'department' => 'ПТО',
                'phone' => '+7 (928) 111-22-33',
                'role' => 'editor',
            ],
            [
                'email' => 'petrova@stav.ltd',
                'full_name' => 'Петрова Анна Сергеевна',
                'password' => 'password',
                'position' => 'Бухгалтер',
                'department' => 'Бухгалтерия',
                'phone' => '+7 (928) 222-33-44',
                'role' => 'editor',
            ],
            [
                'email' => 'sidorov@stav.ltd',
                'full_name' => 'Сидоров Петр Николаевич',
                'password' => 'password',
                'position' => 'Менеджер по продажам',
                'department' => 'Отдел продаж',
                'phone' => '+7 (928) 333-44-55',
                'role' => 'user',
            ],
            [
                'email' => 'kozlov@stav.ltd',
                'full_name' => 'Козлов Алексей Владимирович',
                'password' => 'password',
                'position' => 'Системный администратор',
                'department' => 'ИТ-отдел',
                'phone' => '+7 (928) 444-55-66',
                'role' => 'editor',
            ],
            [
                'email' => 'nikitina@stav.ltd',
                'full_name' => 'Никитина Елена Дмитриевна',
                'password' => 'password',
                'position' => 'Специалист по закупкам',
                'department' => 'Отдел снабжения',
                'phone' => '+7 (928) 555-66-77',
                'role' => 'user',
            ],
            [
                'email' => 'morozov@stav.ltd',
                'full_name' => 'Морозов Дмитрий Олегович',
                'password' => 'password',
                'position' => 'Технолог',
                'department' => 'ПТО',
                'phone' => '+7 (928) 666-77-88',
                'role' => 'user',
            ],
            [
                'email' => 'volkova@stav.ltd',
                'full_name' => 'Волкова Мария Александровна',
                'password' => 'password',
                'position' => 'Главный бухгалтер',
                'department' => 'Бухгалтерия',
                'phone' => '+7 (928) 777-88-99',
                'role' => 'editor',
            ],
            [
                'email' => 'fedorov@stav.ltd',
                'full_name' => 'Федоров Сергей Павлович',
                'password' => 'password',
                'position' => 'Инженер-электрик',
                'department' => 'ПТО',
                'phone' => '+7 (928) 888-99-00',
                'role' => 'editor',
            ],
            [
                'email' => 'sokolova@stav.ltd',
                'full_name' => 'Соколова Ольга Игоревна',
                'password' => 'password',
                'position' => 'Менеджер по работе с клиентами',
                'department' => 'Отдел продаж',
                'phone' => '+7 (928) 999-00-11',
                'role' => 'user',
            ],
            [
                'email' => 'popov@stav.ltd',
                'full_name' => 'Попов Андрей Викторович',
                'password' => 'password',
                'position' => 'Разработчик',
                'department' => 'ИТ-отдел',
                'phone' => '+7 (928) 100-11-22',
                'role' => 'editor',
            ],
            [
                'email' => 'orlova@stav.ltd',
                'full_name' => 'Орлова Татьяна Михайловна',
                'password' => 'password',
                'position' => 'Экономист',
                'department' => 'Бухгалтерия',
                'phone' => '+7 (928) 200-22-33',
                'role' => 'user',
            ],
            [
                'email' => 'lebedev@stav.ltd',
                'full_name' => 'Лебедев Николай Александрович',
                'password' => 'password',
                'position' => 'Логист',
                'department' => 'Отдел снабжения',
                'phone' => '+7 (928) 300-33-44',
                'role' => 'editor',
            ],
            [
                'email' => 'kovalenko@stav.ltd',
                'full_name' => 'Коваленко Виктор Сергеевич',
                'password' => 'password',
                'position' => 'Начальник ПТО',
                'department' => 'ПТО',
                'phone' => '+7 (928) 400-44-55',
                'role' => 'editor',
            ],
            [
                'email' => 'gromova@stav.ltd',
                'full_name' => 'Громова Светлана Андреевна',
                'password' => 'password',
                'position' => 'Ассистент бухгалтера',
                'department' => 'Бухгалтерия',
                'phone' => '+7 (928) 500-55-66',
                'role' => 'user',
            ],
            [
                'email' => 'novikov@stav.ltd',
                'full_name' => 'Новиков Игорь Дмитриевич',
                'password' => 'password',
                'position' => 'Специалист технической поддержки',
                'department' => 'ИТ-отдел',
                'phone' => '+7 (928) 600-66-77',
                'role' => 'user',
            ],
            [
                'email' => 'efimova@stav.ltd',
                'full_name' => 'Ефимова Юлия Владимировна',
                'password' => 'password',
                'position' => 'Торговый представитель',
                'department' => 'Отдел продаж',
                'phone' => '+7 (928) 700-77-88',
                'role' => 'user',
            ],
            [
                'email' => 'vinogradov@stav.ltd',
                'full_name' => 'Виноградов Артём Олегович',
                'password' => 'password',
                'position' => 'Специалист по закупкам',
                'department' => 'Отдел снабжения',
                'phone' => '+7 (928) 800-88-99',
                'role' => 'user',
            ],
        ];

        $users = [];
        foreach ($usersData as $u) {
            $dept = Department::where('name', $u['department'])->first();
            $user = User::firstOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['full_name'],
                    'full_name' => $u['full_name'],
                    'password' => Hash::make($u['password']),
                    'position' => $u['position'],
                    'department_id' => $dept?->id,
                    'phone' => $u['phone'],
                    'role' => $u['role'],
                    'is_active' => true,
                ]
            );
            $users[$u['email']] = $user;
        }

        $admin = $users['admin@stav.ltd'];

        $docTypes = [
            ['name' => 'Технические документы', 'code' => 'technical', 'description' => 'Чертежи, схемы, спецификации, технические отчеты'],
        ];
        foreach ($docTypes as $t) {
            DocumentType::firstOrCreate(['code' => $t['code']], $t);
        }

        $categories = [
            ['name' => 'Технические', 'path' => 'Технические'],
            ['name' => 'Коммерческие', 'path' => 'Коммерческие'],
            ['name' => 'Проектные', 'path' => 'Проектные'],
            ['name' => 'Отчетные', 'path' => 'Отчетные'],
            ['name' => 'Прочие', 'path' => 'Прочие'],
        ];
        foreach ($categories as $c) {
            Category::firstOrCreate(['name' => $c['name']], $c);
        }

        $typeId = DocumentType::first()?->id;
        $categories = [
            'Проектные' => Category::where('name', 'Проектные')->first(),
            'Технические' => Category::where('name', 'Технические')->first(),
            'Коммерческие' => Category::where('name', 'Коммерческие')->first(),
            'Отчетные' => Category::where('name', 'Отчетные')->first(),
            'Прочие' => Category::where('name', 'Прочие')->first(),
        ];

        $documentsData = [
            ['name' => 'Проект фундамента жилого дома ул. Ленина 25', 'category' => 'Проектные', 'status' => 'approved', 'author_email' => 'admin@stav.ltd', 'file' => 'project_foundation_v1.pdf', 'comment' => 'Первоначальная версия проекта'],
            ['name' => 'Техническое задание на разработку системы учёта', 'category' => 'Технические', 'status' => 'approved', 'author_email' => 'prorokov_2019@mail.ru', 'file' => 'tz_system_v1.pdf', 'comment' => 'Утверждённое ТЗ'],
            ['name' => 'Договор поставки № 101 от 01.03.2025', 'category' => 'Коммерческие', 'status' => 'draft', 'author_email' => 'petrova@stav.ltd', 'file' => 'contract_101.docx', 'comment' => 'Черновик договора'],
            ['name' => 'Отчёт о производственной деятельности за Q1 2025', 'category' => 'Отчетные', 'status' => 'review', 'author_email' => 'ivanov@stav.ltd', 'file' => 'report_q1_2025.pdf', 'comment' => 'Отчёт на согласовании'],
            ['name' => 'Спецификация оборудования для цеха № 2', 'category' => 'Технические', 'status' => 'approved', 'author_email' => 'kozlov@stav.ltd', 'file' => 'spec_ceh2.xlsx', 'comment' => 'Согласованная спецификация'],
            ['name' => 'Положение о документообороте', 'category' => 'Прочие', 'status' => 'approved', 'author_email' => 'admin@stav.ltd', 'file' => 'polozhenie_do.pdf', 'comment' => 'Внутренний регламент'],
            ['name' => 'Смета на ремонт офиса', 'category' => 'Коммерческие', 'status' => 'draft', 'author_email' => 'nikitina@stav.ltd', 'file' => 'smeta_remont.xlsx', 'comment' => 'Предварительная смета'],
            ['name' => 'Акт выполненных работ по объекту «Склад А»', 'category' => 'Проектные', 'status' => 'rejected', 'author_email' => 'ivanov@stav.ltd', 'file' => 'akt_sklad_a.pdf', 'comment' => 'Требуются доработки'],
            ['name' => 'Инструкция по охране труда для ИТ-отдела', 'category' => 'Технические', 'status' => 'approved', 'author_email' => 'kozlov@stav.ltd', 'file' => 'instr_ot_it.pdf', 'comment' => 'Утверждённая инструкция'],
            ['name' => 'План закупок на 2025 год', 'category' => 'Отчетные', 'status' => 'review', 'author_email' => 'nikitina@stav.ltd', 'file' => 'plan_zakupok_2025.xlsx', 'comment' => 'На согласовании у руководства'],
            ['name' => 'Коммерческое предложение для ООО «Ромашка»', 'category' => 'Коммерческие', 'status' => 'draft', 'author_email' => 'sidorov@stav.ltd', 'file' => 'kp_romashka.docx', 'comment' => 'Черновик КП'],
            ['name' => 'Журнал учёта версий программного обеспечения', 'category' => 'Прочие', 'status' => 'approved', 'author_email' => 'kozlov@stav.ltd', 'file' => 'journal_po.xlsx', 'comment' => 'Актуальная версия'],
            ['name' => 'Расчёт себестоимости продукции за март 2025', 'category' => 'Отчетные', 'status' => 'approved', 'author_email' => 'volkova@stav.ltd', 'file' => 'sebestoimost_march.pdf', 'comment' => 'Итоговый расчёт'],
            ['name' => 'Чертёж узла соединения КМ-12', 'category' => 'Технические', 'status' => 'draft', 'author_email' => 'morozov@stav.ltd', 'file' => 'km12_node.dwg', 'comment' => 'Черновая версия'],
            ['name' => 'Регламент согласования документов', 'category' => 'Прочие', 'status' => 'approved', 'author_email' => 'admin@stav.ltd', 'file' => 'reglament_soglasovania.pdf', 'comment' => 'Введён в действие'],
            ['name' => 'Отчёт по командировкам за апрель 2025', 'category' => 'Отчетные', 'status' => 'draft', 'author_email' => 'petrova@stav.ltd', 'file' => 'komandirovki_april.docx', 'comment' => 'В работе'],
            ['name' => 'Дополнительное соглашение к договору № 87', 'category' => 'Коммерческие', 'status' => 'review', 'author_email' => 'petrova@stav.ltd', 'file' => 'dop_sogl_87.pdf', 'comment' => 'На подписании'],
            ['name' => 'Описание технологического процесса сборки', 'category' => 'Технические', 'status' => 'approved', 'author_email' => 'morozov@stav.ltd', 'file' => 'tech_process.pdf', 'comment' => 'Актуальная редакция'],
        ];

        if ($typeId && $admin) {
            foreach ($documentsData as $i => $d) {
                $cat = $categories[$d['category']] ?? $categories['Прочие'];
                $author = $users[$d['author_email']] ?? $admin;
                $doc = Document::firstOrCreate(
                    ['name' => $d['name']],
                    [
                        'type_id' => $typeId,
                        'category_id' => $cat?->id,
                        'status' => $d['status'],
                        'author_id' => $author->id,
                    ]
                );
                DocumentVersion::firstOrCreate(
                    ['document_id' => $doc->id, 'version_number' => 1],
                    [
                        'file_name' => $d['file'],
                        'file_url' => '',
                        'file_size' => rand(50000, 5000000),
                        'change_comment' => $d['comment'],
                        'author_id' => $author->id,
                        'created_at' => now()->subDays(rand(1, 90)),
                    ]
                );
            }

            // Один документ с процессом согласования (как в оригинале)
            $categoryProekt = Category::where('name', 'Проектные')->first();
            $docFirst = Document::where('name', 'Проект фундамента жилого дома ул. Ленина 25')->first();
            if ($docFirst && $categoryProekt) {
                $process = ApprovalProcess::firstOrCreate(
                    ['document_id' => $docFirst->id],
                    [
                        'name' => 'Согласование проекта фундамента',
                        'status' => 'completed',
                        'initiator_id' => $admin->id,
                        'start_date' => now()->subDays(5),
                        'end_date' => now()->subDays(2),
                        'deadline' => now()->addDays(3),
                    ]
                );
                ApprovalStep::firstOrCreate(
                    ['process_id' => $process->id, 'step_number' => 1],
                    [
                        'assignee_id' => $admin->id,
                        'status' => 'completed',
                        'decision' => 'approve',
                        'comment' => 'Проект соответствует требованиям',
                        'assigned_at' => now()->subDays(5),
                        'completed_at' => now()->subDays(3),
                    ]
                );
            }
        }
    }
}
