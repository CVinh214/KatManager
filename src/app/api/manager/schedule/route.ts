import { NextRequest, NextResponse } from 'next/server';

// POST: Quản lý approve shift preference và tạo shift chính thức
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      preferenceId, 
      employeeId, 
      date, 
      startTime, 
      endTime, 
      position,
      action // 'approve' hoặc 'modify'
    } = body;

    // Validation
    if (!employeeId || !date || !startTime || !endTime || !position) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { success: false, error: 'Định dạng thời gian không hợp lệ' },
        { status: 400 }
      );
    }

    // Calculate hours
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      return NextResponse.json(
        { success: false, error: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc' },
        { status: 400 }
      );
    }

    const hours = (endMinutes - startMinutes) / 60;

    // Trong thực tế, sẽ sử dụng Prisma để update preference và tạo shift
    // if (preferenceId) {
    //   await prisma.shiftPreference.update({
    //     where: { id: preferenceId },
    //     data: { status: 'approved' }
    //   });
    // }
    // 
    // const shift = await prisma.shift.create({
    //   data: {
    //     employeeId,
    //     date: new Date(date),
    //     start: startTime,
    //     end: endTime,
    //     type: determineShiftType(startTime),
    //     status: 'approved'
    //   }
    // });

    const newShift = {
      id: `shift-${Date.now()}`,
      employeeId,
      date,
      start: startTime,
      end: endTime,
      position,
      hours: Number(hours.toFixed(1)),
      type: determineShiftType(startTime),
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: newShift,
      message: action === 'approve' 
        ? 'Đã duyệt và tạo lịch làm việc thành công'
        : 'Đã sửa đổi và tạo lịch làm việc thành công'
    });
  } catch (error) {
    console.error('Error processing shift:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể xử lý lịch làm việc' },
      { status: 500 }
    );
  }
}

// Helper function: Xác định loại ca dựa trên giờ bắt đầu
function determineShiftType(startTime: string): 'morning' | 'afternoon' | 'evening' {
  const hour = parseInt(startTime.split(':')[0]);
  
  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon';
  } else {
    return 'evening';
  }
}

// PUT: Từ chối shift preference
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferenceId, notes } = body;

    if (!preferenceId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu ID đăng ký' },
        { status: 400 }
      );
    }

    // Trong thực tế sẽ update database
    // await prisma.shiftPreference.update({
    //   where: { id: preferenceId },
    //   data: { 
    //     status: 'rejected',
    //     notes: notes || 'Quản lý từ chối'
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Đã từ chối đăng ký lịch làm việc'
    });
  } catch (error) {
    console.error('Error rejecting preference:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể từ chối đăng ký' },
      { status: 500 }
    );
  }
}
